package com.dromatic.inventory.lot;

import com.dromatic.inventory.map.Rack;

import java.math.BigDecimal;

/**
 * Existencia de un rótulo en una ubicación, lista para mostrar y para ubicar en el mapa.
 *
 * @param levelLabel       "C2"
 * @param locationCode     "B1-P4-C2" (NULL si no está en el mapa)
 * @param locationName     "Bodega 1 · Pasillo 4 · C2" o la nota escrita
 * @param approxContainers contenedores aproximados según las unidades por contenedor
 */
public record StockView(
        Long id,
        Long lotId,
        Long rackId,
        Integer level,
        String areaCode,
        String sectionCode,
        String rackCode,
        String levelLabel,
        String locationCode,
        String locationName,
        BigDecimal quantity,
        BigDecimal weightKg,
        String containerName,
        BigDecimal unitsPerContainer,
        BigDecimal approxContainers) {

    public static final String NO_LOCATION = "Sin ubicación asignada";

    /** Requiere la estantería con su sección y área cargadas. */
    public static StockView from(Stock s) {
        Rack r = s.getRack();
        Integer level = s.getLevel();
        return new StockView(s.getId(), s.getLot().getId(),
                r == null ? null : r.getId(), level,
                r == null ? null : r.getSection().getArea().getCode(),
                r == null ? null : r.getSection().getCode(),
                r == null ? null : r.getCode(),
                r == null ? null : r.levelLabel(level),
                r == null ? null : r.locationCode(level),
                r == null ? (s.getLocationNote() == null ? NO_LOCATION : s.getLocationNote()) : r.locationName(level),
                s.getQuantity(), s.getWeightKg(), s.getContainerName(), s.getUnitsPerContainer(), s.approxContainers());
    }
}
