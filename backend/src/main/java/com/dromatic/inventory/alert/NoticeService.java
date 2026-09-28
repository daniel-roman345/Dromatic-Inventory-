package com.dromatic.inventory.alert;

import com.dromatic.inventory.common.exception.ResourceNotFoundException;
import com.dromatic.inventory.config.AppProperties;
import com.dromatic.inventory.item.Item;
import com.dromatic.inventory.item.ItemQueryService;
import com.dromatic.inventory.item.ItemRepository;
import com.dromatic.inventory.lot.StockRepository;
import com.dromatic.inventory.lot.StockView;
import com.dromatic.inventory.user.User;
import com.dromatic.inventory.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;

import static com.dromatic.inventory.common.text.Numbers.format;

/**
 * Arma el aviso de un artículo (producto, novedad, cuánto hay y dónde) y los
 * enlaces de WhatsApp con el mensaje listo. No envía nada por su cuenta: el
 * usuario abre el enlace y presiona enviar en su WhatsApp.
 */
@Service
@RequiredArgsConstructor
public class NoticeService {

    private static final DateTimeFormatter DATE = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
    private static final int MAX_LOCATIONS = 4;

    private final ItemRepository itemRepository;
    private final StockRepository stockRepository;
    private final UserRepository userRepository;
    private final AppProperties appProperties;

    /**
     * @param headline novedad escrita por el usuario; si viene vacía se calcula
     * @param note     comentario adicional (opcional)
     * @param sender   quien envía el aviso (NULL en los correos automáticos)
     */
    @Transactional(readOnly = true)
    public InventoryNotice build(Long itemId, String headline, String note, User sender) {
        Item item = itemRepository.findWithModule(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("El artículo no existe."));
        List<StockView> stock = stockRepository.findByItem(itemId).stream().map(StockView::from).toList();
        BigDecimal total = stock.stream().map(StockView::quantity).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal minimum = item.getMinimumStock();
        String novelty = headline != null && !headline.isBlank() ? headline.trim() : autoHeadline(total, minimum);
        List<String> locations = new ArrayList<>(new LinkedHashSet<>(stock.stream().map(StockView::locationName).toList()));
        LocalDateTime now = LocalDateTime.now();
        String link = appProperties.publicUrl() + "/articulos/" + item.getId();

        StringBuilder text = new StringBuilder()
                .append('*').append(appProperties.company().name()).append("*\n")
                .append("*Aviso de inventario: ").append(novelty).append("*\n\n")
                .append("Producto: ").append(item.displayName()).append('\n')
                .append("Módulo: ").append(item.getModule().getName()).append('\n')
                .append("Cantidad actual: ").append(format(total)).append(' ').append(item.getUnitName()).append('\n');
        if (minimum != null && minimum.signum() > 0) {
            text.append("Mínimo: ").append(format(minimum)).append(' ').append(item.getUnitName()).append('\n');
        }
        if (!locations.isEmpty()) {
            text.append("Ubicación: ").append(String.join("; ", locations.subList(0, Math.min(MAX_LOCATIONS, locations.size()))));
            if (locations.size() > MAX_LOCATIONS) {
                text.append(" (y ").append(locations.size() - MAX_LOCATIONS).append(" más)");
            }
            text.append('\n');
        }
        text.append("Fecha: ").append(now.format(DATE)).append('\n');
        if (note != null && !note.isBlank()) {
            text.append('\n').append(note.trim()).append('\n');
        }
        text.append('\n').append(sender != null
                ? "Enviado por " + sender.getFullName() + " desde el sistema de inventario DIS."
                : "Aviso automático del sistema de inventario DIS.");

        return new InventoryNotice(item.getId(), item.displayName(), item.getModule().getName(), item.getUnitName(),
                total, minimum, novelty, locations, now, link, text.toString());
    }

    /** Un botón por cada persona que recibe alertas y tiene WhatsApp registrado. */
    @Transactional(readOnly = true)
    public WhatsAppResponse whatsapp(InventoryNotice notice) {
        String encoded = URLEncoder.encode(notice.text(), StandardCharsets.UTF_8).replace("+", "%20");
        List<WhatsAppResponse.Recipient> recipients = userRepository.findByActiveTrueAndReceivesStockAlertsTrue().stream()
                .filter(u -> u.getPhone() != null && !u.getPhone().isBlank())
                .map(u -> new WhatsAppResponse.Recipient(u.getFullName(), u.getJobTitle(), u.getPhone(),
                        "https://wa.me/" + u.getPhone() + "?text=" + encoded))
                .toList();
        // Sin destinatario fijo: WhatsApp deja escoger el contacto.
        return new WhatsAppResponse(notice.headline(), notice.text(), recipients, "https://wa.me/?text=" + encoded);
    }

    static String autoHeadline(BigDecimal total, BigDecimal minimum) {
        if (total.signum() == 0) {
            return "Producto agotado";
        }
        if (ItemQueryService.isLow(total, minimum)) {
            return "Stock bajo";
        }
        return "Estado del inventario";
    }
}
