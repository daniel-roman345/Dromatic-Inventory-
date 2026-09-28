package com.dromatic.inventory.movement;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Movimiento del historial, listo para mostrar.
 *
 * @param fromLocation ubicación de origen legible ("Bodega 1 · Pasillo 4 · C2") o NULL
 * @param toLocation   ubicación de destino legible o NULL
 */
public record MovementResponse(
        Long id,
        MovementEffect effect,
        String movementType,
        Long itemId,
        String itemName,
        String presentation,
        String moduleCode,
        String moduleName,
        String moduleColor,
        Long lotId,
        String lotNumber,
        LocalDate labelDate,
        BigDecimal quantity,
        BigDecimal stockDelta,
        String unitName,
        BigDecimal containers,
        String containerName,
        BigDecimal unitsPerContainer,
        BigDecimal weightKg,
        Long fromRackId,
        Integer fromLevel,
        String fromLocation,
        Long toRackId,
        Integer toLevel,
        String toLocation,
        String reason,
        String note,
        String reference,
        LocalDate movementDate,
        String createdBy,
        LocalDateTime createdAt,
        boolean voided,
        LocalDateTime voidedAt,
        String voidedBy,
        String voidReason) {
}
