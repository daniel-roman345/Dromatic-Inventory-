package com.dromatic.inventory.dashboard;

import com.dromatic.inventory.alert.StockAlert;
import com.dromatic.inventory.alert.StockAlertRepository;
import com.dromatic.inventory.module.InventoryModule;
import com.dromatic.inventory.module.InventoryModuleRepository;
import com.dromatic.inventory.module.ModulePermissionService;
import com.dromatic.inventory.movement.MovementQueryService;
import com.dromatic.inventory.security.CurrentUserService;
import com.dromatic.inventory.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Date;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class DashboardService {

    /** Rótulos que vencen dentro de estos días aparecen en el inicio. */
    private static final int EXPIRY_WINDOW_DAYS = 60;

    private static final String MODULE_STATS = """
            SELECT i.module_id,
                   COUNT(DISTINCT i.id) AS items,
                   COUNT(DISTINCT CASE WHEN t.total > 0 THEN i.id END) AS with_stock,
                   COUNT(DISTINCT CASE WHEN i.minimum_stock > 0 AND COALESCE(t.total, 0) <= i.minimum_stock
                                       THEN i.id END) AS low_stock,
                   COALESCE(SUM(t.unverified), 0) AS unverified
            FROM items i
            LEFT JOIN (
                SELECT l.item_id, SUM(s.quantity) AS total,
                       COUNT(DISTINCT CASE WHEN l.verified = FALSE AND s.quantity > 0 THEN l.id END) AS unverified
                FROM lots l JOIN stock s ON s.lot_id = l.id
                GROUP BY l.item_id
            ) t ON t.item_id = i.id
            WHERE i.status = 'ACTIVO'
            GROUP BY i.module_id""";

    private static final String EXPIRING = """
            SELECT l.id AS lot_id, i.id AS item_id, CONCAT(i.name, COALESCE(CONCAT(' ', i.presentation), '')) AS item_name,
                   m.code AS module_code, m.color AS module_color, l.lot_number, l.expiry_date,
                   SUM(s.quantity) AS total, i.unit_name
            FROM lots l
            JOIN items i ON i.id = l.item_id
            JOIN inventory_modules m ON m.id = i.module_id
            JOIN stock s ON s.lot_id = l.id AND s.quantity > 0
            WHERE l.expiry_date IS NOT NULL AND l.expiry_date <= :limit
            GROUP BY l.id, i.id, i.name, i.presentation, m.code, m.color, l.lot_number, l.expiry_date, i.unit_name
            ORDER BY l.expiry_date
            LIMIT 10""";

    private final NamedParameterJdbcTemplate jdbc;
    private final InventoryModuleRepository moduleRepository;
    private final ModulePermissionService permissionService;
    private final StockAlertRepository alertRepository;
    private final MovementQueryService movementQueryService;
    private final CurrentUserService currentUserService;

    @Transactional(readOnly = true)
    public DashboardResponse get() {
        User user = currentUserService.currentUser();
        Map<Long, long[]> stats = new HashMap<>();
        jdbc.query(MODULE_STATS, new MapSqlParameterSource(), rs -> {
            stats.put(rs.getLong("module_id"), new long[]{rs.getLong("items"), rs.getLong("with_stock"),
                    rs.getLong("low_stock"), rs.getLong("unverified")});
        });
        List<DashboardResponse.ModuleStats> modules = moduleRepository.findByActiveTrueOrderBySortOrderAsc().stream()
                .map(m -> toStats(m, stats.getOrDefault(m.getId(), new long[4]), user))
                .toList();

        LocalDate today = LocalDate.now();
        List<DashboardResponse.ExpiringLot> expiring = jdbc.query(EXPIRING,
                new MapSqlParameterSource("limit", Date.valueOf(today.plusDays(EXPIRY_WINDOW_DAYS))),
                (rs, n) -> {
                    LocalDate expiry = rs.getDate("expiry_date").toLocalDate();
                    return new DashboardResponse.ExpiringLot(rs.getLong("lot_id"), rs.getLong("item_id"),
                            rs.getString("item_name"), rs.getString("module_code"), rs.getString("module_color"),
                            rs.getString("lot_number"), expiry, ChronoUnit.DAYS.between(today, expiry),
                            rs.getBigDecimal("total"), rs.getString("unit_name"));
                });

        Long todayCount = jdbc.queryForObject(
                "SELECT COUNT(*) FROM movements WHERE movement_date = :today AND voided = FALSE",
                new MapSqlParameterSource("today", Date.valueOf(today)), Long.class);
        long unverified = modules.stream().mapToLong(DashboardResponse.ModuleStats::unverified).sum();

        var recent = movementQueryService.search(new MovementQueryService.Filter(null, null, null, null, null, null,
                null, true), 0, 8).content();

        return new DashboardResponse(modules, alertRepository.countByStatus(StockAlert.ABIERTA), unverified,
                todayCount == null ? 0 : todayCount, expiring, recent);
    }

    private DashboardResponse.ModuleStats toStats(InventoryModule m, long[] s, User user) {
        return new DashboardResponse.ModuleStats(m.getId(), m.getCode(), m.getName(), m.getColor(), m.getIcon(),
                permissionService.canEdit(user, m), s[0], s[1], s[2], s[3]);
    }
}
