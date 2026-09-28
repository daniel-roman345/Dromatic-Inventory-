package com.dromatic.inventory.item;

import com.dromatic.inventory.lot.LotResponse;
import com.dromatic.inventory.module.ModuleResponse;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Ficha completa de un artículo: datos, imágenes, rótulos con sus ubicaciones
 * (para marcarlas en el mapa) y las formas de empaque usadas antes.
 */
public record ItemDetailResponse(
        Long id,
        String code,
        String name,
        String presentation,
        String description,
        String unitName,
        BigDecimal minimumStock,
        String status,
        ModuleResponse module,
        BigDecimal total,
        boolean lowStock,
        boolean hasFrontImage,
        boolean hasBackImage,
        String frontImageSource,
        String backImageSource,
        String lastContainerName,
        BigDecimal lastUnitsPerContainer,
        List<Packaging> packagings,
        List<LotResponse> lots,
        String createdBy,
        LocalDateTime createdAt,
        LocalDateTime updatedAt) {

    /** Forma de empaque usada en entradas anteriores: "canasta de 230", "caja de 350". */
    public record Packaging(String containerName, BigDecimal unitsPerContainer, long times) {
    }
}
