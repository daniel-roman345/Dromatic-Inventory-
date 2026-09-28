package com.dromatic.inventory.alert;

import com.dromatic.inventory.config.AppProperties;
import com.dromatic.inventory.user.User;
import com.dromatic.inventory.user.UserRepository;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.util.HtmlUtils;

import java.io.UnsupportedEncodingException;
import java.time.LocalDateTime;
import java.util.List;

import static com.dromatic.inventory.common.text.Numbers.format;

/**
 * Envía el correo de stock bajo a las personas marcadas para recibir alertas.
 * Funciona con cualquier servidor SMTP (Gmail, Outlook o el dominio propio) que
 * se configure en {@code backend/.env}. Si no está configurado, la alerta queda
 * registrada como SIN_CONFIGURAR y el botón de WhatsApp sigue funcionando.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AlertMailer {

    private final ObjectProvider<JavaMailSender> mailSender;
    private final StockAlertRepository alertRepository;
    private final UserRepository userRepository;
    private final NoticeService noticeService;
    private final AppProperties appProperties;
    private final TransactionTemplate transactionTemplate;

    @Value("${spring.mail.host:}")
    private String mailHost;

    @Value("${spring.mail.username:}")
    private String mailUsername;

    /** Resultado de un envío, para mostrarlo en pantalla. */
    public record Result(String status, String message) {
    }

    public boolean isConfigured() {
        return !mailHost.isBlank() && !mailUsername.isBlank() && mailSender.getIfAvailable() != null;
    }

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onAlertOpened(AlertOpenedEvent event) {
        send(event.alertId());
    }

    /** Envía (o reenvía) el correo de una alerta y guarda el resultado. */
    public Result send(Long alertId) {
        StockAlert alert = transactionTemplate.execute(s -> alertRepository.findWithItem(alertId).orElse(null));
        if (alert == null) {
            return new Result(StockAlert.EMAIL_ERROR, "La alerta no existe.");
        }
        Result result;
        List<User> recipients = recipients();
        if (!isConfigured()) {
            result = new Result(StockAlert.EMAIL_SIN_CONFIGURAR,
                    "El correo no está configurado. Use el botón de WhatsApp o configure el correo en backend/.env.");
        } else if (recipients.isEmpty()) {
            result = new Result(StockAlert.EMAIL_SIN_DESTINATARIOS,
                    "Nadie tiene activado recibir alertas con un correo registrado. Revíselo en Usuarios.");
        } else {
            InventoryNotice notice = noticeService.build(alert.getItem().getId(), null, null, null);
            String subject = notice.headline() + ": " + notice.itemName() + " (" + notice.moduleName() + ")";
            result = deliver(recipients, subject, noticeHtml(notice));
        }
        saveResult(alertId, result);
        return result;
    }

    /** Correo de prueba para comprobar la configuración. */
    public Result sendTest(User requester) {
        if (!isConfigured()) {
            return new Result(StockAlert.EMAIL_SIN_CONFIGURAR, "El correo no está configurado en backend/.env "
                    + "(MAIL_HOST, MAIL_USERNAME y MAIL_PASSWORD).");
        }
        List<User> recipients = recipients();
        if (recipients.isEmpty()) {
            return new Result(StockAlert.EMAIL_SIN_DESTINATARIOS,
                    "Nadie tiene activado recibir alertas con un correo registrado. Revíselo en Usuarios.");
        }
        String body = layout("Prueba de correo",
                "<p>Este es un correo de prueba enviado por " + escape(requester.getFullName())
                        + " desde el sistema de inventario DIS.</p>"
                        + "<p>Si lo está leyendo, las alertas de stock bajo le llegarán a este correo.</p>", null);
        return deliver(recipients, "Prueba de correo · Inventario DIS", body);
    }

    private List<User> recipients() {
        return userRepository.findByActiveTrueAndReceivesStockAlertsTrue().stream()
                .filter(u -> u.getEmail() != null && !u.getEmail().isBlank())
                .toList();
    }

    private Result deliver(List<User> recipients, String subject, String html) {
        JavaMailSender sender = mailSender.getIfAvailable();
        try {
            MimeMessage message = sender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            String from = appProperties.mail() != null && appProperties.mail().from() != null
                    && !appProperties.mail().from().isBlank() ? appProperties.mail().from() : mailUsername;
            helper.setFrom(new InternetAddress(from, appProperties.company().name() + " · Inventario", "UTF-8"));
            helper.setTo(recipients.stream().map(User::getEmail).toArray(String[]::new));
            helper.setSubject(subject);
            helper.setText(html.replaceAll("<[^>]+>", " ").replaceAll("\\s+", " ").trim(), html);
            sender.send(message);
            String names = String.join(", ", recipients.stream().map(User::getFullName).toList());
            return new Result(StockAlert.EMAIL_ENVIADO, "Correo enviado a " + names + ".");
        } catch (MailException | MessagingException | UnsupportedEncodingException e) {
            log.warn("No se pudo enviar el correo de alerta: {}", e.getMessage());
            String detail = e.getMessage() == null ? e.getClass().getSimpleName() : e.getMessage();
            return new Result(StockAlert.EMAIL_ERROR, "No se pudo enviar el correo: "
                    + (detail.length() > 200 ? detail.substring(0, 200) : detail));
        }
    }

    private void saveResult(Long alertId, Result result) {
        transactionTemplate.executeWithoutResult(s -> alertRepository.findById(alertId).ifPresent(a -> {
            a.setEmailStatus(result.status());
            a.setEmailError(StockAlert.EMAIL_ENVIADO.equals(result.status()) ? null : result.message());
            if (StockAlert.EMAIL_ENVIADO.equals(result.status())) {
                a.setEmailSentAt(LocalDateTime.now());
            }
        }));
    }

    private String noticeHtml(InventoryNotice n) {
        StringBuilder rows = new StringBuilder()
                .append(row("Producto", "<strong>" + escape(n.itemName()) + "</strong>"))
                .append(row("Módulo", escape(n.moduleName())))
                .append(row("Cantidad actual", "<strong style=\"color:#b42318\">" + format(n.total()) + " "
                        + escape(n.unitName()) + "</strong>"));
        if (n.minimum() != null && n.minimum().signum() > 0) {
            rows.append(row("Mínimo", format(n.minimum()) + " " + escape(n.unitName())));
        }
        if (!n.locations().isEmpty()) {
            rows.append(row("Ubicación", String.join("<br>", n.locations().stream().map(AlertMailer::escape).toList())));
        }
        String content = "<table style=\"border-collapse:collapse;width:100%;font-size:15px\">" + rows + "</table>";
        return layout(n.headline(), content, n.link());
    }

    private String layout(String title, String content, String link) {
        var company = appProperties.company();
        String button = link == null ? "" : "<p style=\"margin:24px 0 8px\"><a href=\"" + escape(link)
                + "\" style=\"background:#0f766e;color:#ffffff;padding:10px 18px;border-radius:6px;"
                + "text-decoration:none;font-weight:600\">Ver en el sistema</a></p>";
        return "<div style=\"font-family:Segoe UI,Arial,sans-serif;max-width:560px;margin:0 auto;color:#1f2937\">"
                + "<div style=\"border-bottom:3px solid #0f766e;padding:12px 0;margin-bottom:16px\">"
                + "<div style=\"font-size:13px;color:#6b7280\">" + escape(company.name()) + " · Inventario</div>"
                + "<div style=\"font-size:20px;font-weight:700\">" + escape(title) + "</div></div>"
                + content + button
                + "<p style=\"font-size:12px;color:#9ca3af;margin-top:24px\">Aviso automático del sistema de inventario DIS. "
                + escape(company.address()) + " · " + escape(company.phone()) + "</p></div>";
    }

    private static String row(String label, String value) {
        return "<tr><td style=\"padding:6px 12px 6px 0;color:#6b7280;vertical-align:top;white-space:nowrap\">" + label
                + "</td><td style=\"padding:6px 0\">" + value + "</td></tr>";
    }

    private static String escape(String value) {
        return value == null ? "" : HtmlUtils.htmlEscape(value);
    }
}
