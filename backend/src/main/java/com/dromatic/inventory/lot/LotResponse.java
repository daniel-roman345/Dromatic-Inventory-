package com.dromatic.inventory.lot;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/** Rótulo con lo que hay de él en cada ubicación. */
public record LotResponse(
        Long id,
        Long itemId,
        String itemName,
        String itemPresentation,
        String unitName,
        String moduleCode,
        LocalDate labelDate,
        String materialType,
        String lotNumber,
        String declaredQuantity,
        String supplier,
        LocalDate receptionDate,
        LocalDate analysisDate,
        LocalDate reanalysisDate,
        LocalDate expiryDate,
        String analysisNumber,
        String reanalysisNumber,
        String qualityStatus,
        List<String> qualityStickers,
        String responsible,
        String qcSignature,
        Integer nfpaHealth,
        Integer nfpaFlammability,
        Integer nfpaReactivity,
        String nfpaSpecial,
        String notes,
        boolean verified,
        String createdBy,
        LocalDateTime createdAt,
        String updatedBy,
        LocalDateTime updatedAt,
        BigDecimal total,
        List<StockView> stock) {

    /** Requiere el artículo, su módulo y los usuarios cargados. */
    public static LotResponse from(Lot l, List<StockView> stock) {
        var item = l.getItem();
        BigDecimal total = stock.stream().map(StockView::quantity).reduce(BigDecimal.ZERO, BigDecimal::add);
        return new LotResponse(l.getId(), item.getId(), item.getName(), item.getPresentation(), item.getUnitName(),
                item.getModule().getCode(), l.getLabelDate(), l.getMaterialType(), l.getLotNumber(),
                l.getDeclaredQuantity(), l.getSupplier(), l.getReceptionDate(), l.getAnalysisDate(),
                l.getReanalysisDate(), l.getExpiryDate(), l.getAnalysisNumber(), l.getReanalysisNumber(),
                l.getQualityStatus(), l.getQualityStickers() == null ? List.of() : List.of(l.getQualityStickers().split(",")),
                l.getResponsible(), l.getQcSignature(), toInt(l.getNfpaHealth()),
                toInt(l.getNfpaFlammability()), toInt(l.getNfpaReactivity()), l.getNfpaSpecial(), l.getNotes(),
                Boolean.TRUE.equals(l.getVerified()), l.getCreatedBy().getFullName(), l.getCreatedAt(),
                l.getUpdatedBy() == null ? null : l.getUpdatedBy().getFullName(), l.getUpdatedAt(), total, stock);
    }

    private static Integer toInt(Byte value) {
        return value == null ? null : value.intValue();
    }
}
