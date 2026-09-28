package com.dromatic.inventory.alert;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * @param quantityAtOpen  cuánto había cuando se abrió la alerta
 * @param currentQuantity cuánto hay ahora
 * @param ackBy           quien marcó que ya se está gestionando (ej. "pedido hecho")
 */
public record AlertResponse(
        Long id,
        Long itemId,
        String itemName,
        String moduleCode,
        String moduleName,
        String moduleColor,
        String unitName,
        String status,
        BigDecimal quantityAtOpen,
        BigDecimal minimumStock,
        BigDecimal currentQuantity,
        LocalDateTime createdAt,
        LocalDateTime closedAt,
        String closedReason,
        String emailStatus,
        LocalDateTime emailSentAt,
        String emailError,
        String ackBy,
        LocalDateTime ackAt,
        String ackNote) {
}
