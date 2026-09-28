package com.dromatic.inventory.item;

import java.math.BigDecimal;

/**
 * Fila del listado de inventario de un módulo.
 *
 * @param lots       rótulos con existencia
 * @param locations  ubicaciones donde hay existencia
 * @param unverified rótulos por verificar (cargados desde los videos)
 */
public record ItemRow(
        Long id,
        String code,
        String name,
        String presentation,
        String unitName,
        BigDecimal minimumStock,
        String status,
        String moduleCode,
        String moduleName,
        String moduleColor,
        BigDecimal total,
        long lots,
        long locations,
        long unverified,
        boolean lowStock,
        boolean hasFrontImage,
        boolean hasBackImage) {
}
