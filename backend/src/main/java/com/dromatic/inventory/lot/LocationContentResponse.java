package com.dromatic.inventory.lot;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/** Lo que hay guardado en un piso (ej. Bodega 1 · Pasillo 4 · C2). */
public record LocationContentResponse(
        Long rackId,
        int level,
        String levelLabel,
        String locationCode,
        String locationName,
        String sectionNotes,
        String rackNotes,
        List<Entry> entries) {

    /** Un rótulo guardado en el piso. */
    public record Entry(
            Long stockId,
            Long lotId,
            Long itemId,
            String itemName,
            String presentation,
            String unitName,
            String moduleCode,
            String moduleName,
            String moduleColor,
            String lotNumber,
            LocalDate labelDate,
            String qualityStatus,
            boolean verified,
            BigDecimal quantity,
            BigDecimal weightKg,
            String containerName,
            BigDecimal approxContainers) {
    }
}
