package com.dromatic.inventory.dashboard;

import com.dromatic.inventory.movement.MovementResponse;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/** Resumen de la pantalla de inicio. */
public record DashboardResponse(
        List<ModuleStats> modules,
        long openAlerts,
        long unverifiedLots,
        long movementsToday,
        List<ExpiringLot> expiringLots,
        List<MovementResponse> recentMovements) {

    /**
     * @param lowStock     artículos activos en el mínimo o por debajo
     * @param unverified   rótulos por verificar (cargados desde los videos)
     */
    public record ModuleStats(Long id, String code, String name, String color, String icon, boolean canEdit,
                              long items, long itemsWithStock, long lowStock, long unverified) {
    }

    public record ExpiringLot(Long lotId, Long itemId, String itemName, String moduleCode, String moduleColor,
                              String lotNumber, LocalDate expiryDate, long daysLeft, BigDecimal total, String unitName) {
    }
}
