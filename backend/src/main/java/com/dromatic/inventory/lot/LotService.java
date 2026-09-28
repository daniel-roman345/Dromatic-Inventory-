package com.dromatic.inventory.lot;

import com.dromatic.inventory.common.exception.ResourceNotFoundException;
import com.dromatic.inventory.map.MapService;
import com.dromatic.inventory.map.Rack;
import com.dromatic.inventory.module.ModulePermissionService;
import com.dromatic.inventory.security.CurrentUserService;
import com.dromatic.inventory.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/** Consulta y corrección de rótulos. Las cantidades solo cambian con movimientos. */
@Service
@RequiredArgsConstructor
public class LotService {

    private final LotRepository lotRepository;
    private final StockRepository stockRepository;
    private final MapService mapService;
    private final ModulePermissionService permissionService;
    private final CurrentUserService currentUserService;

    @Transactional(readOnly = true)
    public LotResponse get(Long id) {
        Lot lot = find(id);
        return LotResponse.from(lot, stockViews(lot.getId()));
    }

    /** Corrige lo escrito en el rótulo (ej. un número de lote mal copiado). */
    @Transactional
    public LotResponse update(Long id, LabelRequest request) {
        Lot lot = find(id);
        User user = currentUserService.currentUser();
        permissionService.requireEdit(user, lot.getItem().getModule());
        applyLabel(lot, request);
        lot.setUpdatedBy(user);
        return LotResponse.from(lot, stockViews(lot.getId()));
    }

    /** Confirma un rótulo cargado desde los videos después de revisarlo en la bodega. */
    @Transactional
    public LotResponse verify(Long id) {
        Lot lot = find(id);
        User user = currentUserService.currentUser();
        permissionService.requireEdit(user, lot.getItem().getModule());
        lot.setVerified(true);
        lot.setUpdatedBy(user);
        return LotResponse.from(lot, stockViews(lot.getId()));
    }

    /** Contenido de un piso: lo que se ve al hacer clic en C2 del pasillo 4. */
    @Transactional(readOnly = true)
    public LocationContentResponse contentAt(Long rackId, int level) {
        Rack rack = mapService.requireLocation(rackId, level);
        List<LocationContentResponse.Entry> entries = stockRepository.findAtLocation(rackId, level).stream()
                .map(s -> {
                    Lot l = s.getLot();
                    var item = l.getItem();
                    var module = item.getModule();
                    return new LocationContentResponse.Entry(s.getId(), l.getId(), item.getId(), item.getName(),
                            item.getPresentation(), item.getUnitName(), module.getCode(), module.getName(),
                            module.getColor(), l.getLotNumber(), l.getLabelDate(), l.getQualityStatus(),
                            Boolean.TRUE.equals(l.getVerified()), s.getQuantity(), s.getWeightKg(),
                            s.getContainerName(), s.approxContainers());
                }).toList();
        return new LocationContentResponse(rack.getId(), level, rack.levelLabel(level), rack.locationCode(level),
                rack.locationName(level), rack.getSection().getNotes(), rack.getNotes(), entries);
    }

    public List<StockView> stockViews(Long lotId) {
        return stockRepository.findByLot(lotId).stream().map(StockView::from).toList();
    }

    /** Copia los campos del rótulo al lote (se usa también al registrar una entrada). */
    public static void applyLabel(Lot lot, LabelRequest r) {
        lot.setLabelDate(r.labelDate());
        lot.setMaterialType(r.materialType().trim());
        lot.setLotNumber(clean(r.lotNumber()));
        lot.setDeclaredQuantity(clean(r.declaredQuantity()));
        lot.setSupplier(clean(r.supplier()));
        lot.setReceptionDate(r.receptionDate());
        lot.setAnalysisDate(r.analysisDate());
        lot.setReanalysisDate(r.reanalysisDate());
        lot.setExpiryDate(r.expiryDate());
        lot.setAnalysisNumber(clean(r.analysisNumber()));
        lot.setReanalysisNumber(clean(r.reanalysisNumber()));
        lot.setQualityStatus(clean(r.qualityStatus()));
        lot.setResponsible(clean(r.responsible()));
        lot.setQcSignature(clean(r.qcSignature()));
        lot.setNfpaHealth(toByte(r.nfpaHealth()));
        lot.setNfpaFlammability(toByte(r.nfpaFlammability()));
        lot.setNfpaReactivity(toByte(r.nfpaReactivity()));
        lot.setNfpaSpecial(clean(r.nfpaSpecial()));
        lot.setNotes(clean(r.notes()));
    }

    private Lot find(Long id) {
        return lotRepository.findFull(id).orElseThrow(() -> new ResourceNotFoundException("El rótulo no existe."));
    }

    private static String clean(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private static Byte toByte(Integer value) {
        return value == null ? null : value.byteValue();
    }
}
