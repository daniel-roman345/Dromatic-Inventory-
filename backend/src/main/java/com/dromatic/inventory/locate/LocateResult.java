package com.dromatic.inventory.locate;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Dónde está un rótulo: una fila por cada ubicación con existencia.
 *
 * @param areaCode     mapa donde está (B1, CE) o NULL si no está en un mapa
 * @param locationCode "B1-P4-C2"
 * @param locationName "Bodega 1 · Pasillo 4 · C2" o la ubicación escrita
 */
public record LocateResult(
        Long stockId,
        Long itemId,
        String itemName,
        String presentation,
        String unitName,
        String moduleCode,
        String moduleName,
        String moduleColor,
        Long lotId,
        String lotNumber,
        LocalDate labelDate,
        String supplier,
        boolean verified,
        BigDecimal quantity,
        String containerName,
        BigDecimal unitsPerContainer,
        Long rackId,
        Integer level,
        String areaCode,
        String locationCode,
        String locationName) {
}
