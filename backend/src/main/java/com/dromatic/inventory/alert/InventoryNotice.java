package com.dromatic.inventory.alert;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Aviso sobre un artículo, listo para enviar por correo o WhatsApp.
 *
 * @param headline la novedad: "Stock bajo", "Producto agotado" o la que escriba el usuario
 * @param text     mensaje completo en texto plano (el mismo que va por WhatsApp)
 */
public record InventoryNotice(
        Long itemId,
        String itemName,
        String moduleName,
        String unitName,
        BigDecimal total,
        BigDecimal minimum,
        String headline,
        List<String> locations,
        LocalDateTime date,
        String link,
        String text) {
}
