package com.dromatic.inventory.alert;

import com.dromatic.inventory.common.exception.BusinessException;
import com.dromatic.inventory.common.exception.ResourceNotFoundException;
import com.dromatic.inventory.lot.StockRepository;
import com.dromatic.inventory.security.CurrentUserService;
import com.dromatic.inventory.user.User;
import com.dromatic.inventory.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class AlertService {

    private final StockAlertRepository alertRepository;
    private final StockRepository stockRepository;
    private final UserRepository userRepository;
    private final NoticeService noticeService;
    private final AlertMailer alertMailer;
    private final CurrentUserService currentUserService;

    /** Quién recibe las alertas y si el correo está listo. */
    public record ConfigResponse(boolean emailConfigured, List<Recipient> recipients) {
        public record Recipient(String name, String jobTitle, String email, String phone) {
        }
    }

    @Transactional(readOnly = true)
    public List<AlertResponse> list(String status) {
        String filter = status == null || status.isBlank() || "TODAS".equalsIgnoreCase(status)
                ? null : status.trim().toUpperCase(Locale.ROOT);
        return alertRepository.findByStatusWithItem(filter).stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public long openCount() {
        return alertRepository.countByStatus(StockAlert.ABIERTA);
    }

    /** Mensaje de WhatsApp de una alerta, a nombre de quien lo va a enviar. */
    @Transactional(readOnly = true)
    public WhatsAppResponse whatsappForAlert(Long alertId) {
        StockAlert alert = find(alertId);
        User sender = currentUserService.currentUser();
        return noticeService.whatsapp(noticeService.build(alert.getItem().getId(), null, null, sender));
    }

    /**
     * Mensaje de WhatsApp sobre cualquier artículo, con la novedad que escriba
     * el usuario (si la deja vacía se calcula: stock bajo, agotado...).
     */
    @Transactional(readOnly = true)
    public WhatsAppResponse whatsappForItem(Long itemId, String headline, String note) {
        User sender = currentUserService.currentUser();
        return noticeService.whatsapp(noticeService.build(itemId, headline, note, sender));
    }

    /** Cualquier usuario puede marcar que ya se está gestionando (ej. "Pedido hecho al proveedor"). */
    @Transactional
    public AlertResponse acknowledge(Long alertId, String note) {
        StockAlert alert = find(alertId);
        if (!StockAlert.ABIERTA.equals(alert.getStatus())) {
            throw new BusinessException("La alerta ya está cerrada.");
        }
        alert.setAckBy(currentUserService.currentUser());
        alert.setAckAt(LocalDateTime.now());
        alert.setAckNote(note == null || note.isBlank() ? "En gestión" : note.trim());
        return toResponse(alert);
    }

    @Transactional(readOnly = true)
    public ConfigResponse config() {
        var recipients = userRepository.findByActiveTrueAndReceivesStockAlertsTrue().stream()
                .map(u -> new ConfigResponse.Recipient(u.getFullName(), u.getJobTitle(), u.getEmail(), u.getPhone()))
                .toList();
        return new ConfigResponse(alertMailer.isConfigured(), recipients);
    }

    public AlertMailer.Result resendEmail(Long alertId) {
        return alertMailer.send(alertId);
    }

    @Transactional(readOnly = true)
    public AlertMailer.Result testEmail() {
        return alertMailer.sendTest(currentUserService.currentUser());
    }

    private StockAlert find(Long id) {
        return alertRepository.findWithItem(id).orElseThrow(() -> new ResourceNotFoundException("La alerta no existe."));
    }

    private AlertResponse toResponse(StockAlert a) {
        var item = a.getItem();
        var module = item.getModule();
        return new AlertResponse(a.getId(), item.getId(), item.displayName(), module.getCode(), module.getName(),
                module.getColor(), item.getUnitName(), a.getStatus(), a.getQuantity(), a.getMinimumStock(),
                stockRepository.totalByItem(item.getId()), a.getCreatedAt(), a.getClosedAt(), a.getClosedReason(),
                a.getEmailStatus(), a.getEmailSentAt(), a.getEmailError(),
                a.getAckBy() == null ? null : a.getAckBy().getFullName(), a.getAckAt(), a.getAckNote());
    }
}
