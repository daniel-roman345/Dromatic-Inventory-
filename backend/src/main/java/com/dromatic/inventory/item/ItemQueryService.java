package com.dromatic.inventory.item;

import com.dromatic.inventory.common.exception.ResourceNotFoundException;
import com.dromatic.inventory.common.web.PageResponse;
import com.dromatic.inventory.lot.Lot;
import com.dromatic.inventory.lot.LotRepository;
import com.dromatic.inventory.lot.LotResponse;
import com.dromatic.inventory.lot.StockRepository;
import com.dromatic.inventory.lot.StockView;
import com.dromatic.inventory.module.ModuleService;
import com.dromatic.inventory.security.CurrentUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

/** Consultas del catálogo: listado con totales y ficha completa del artículo. */
@Service
@RequiredArgsConstructor
public class ItemQueryService {

    /** Rótulos agotados que se muestran en la ficha, además de los que tienen existencia. */
    private static final int EMPTY_LOTS_SHOWN = 10;

    private static final String FROM_WHERE = """
            FROM items i
            JOIN inventory_modules m ON m.id = i.module_id
            LEFT JOIN (
                SELECT l.item_id,
                       SUM(s.quantity) AS total,
                       COUNT(DISTINCT CASE WHEN s.quantity > 0 THEN l.id END) AS lots,
                       COUNT(CASE WHEN s.quantity > 0 THEN s.id END) AS locations,
                       COUNT(DISTINCT CASE WHEN s.quantity > 0 AND l.verified = FALSE THEN l.id END) AS unverified
                FROM lots l JOIN stock s ON s.lot_id = l.id
                GROUP BY l.item_id
            ) st ON st.item_id = i.id
            WHERE (:module IS NULL OR m.code = :module)
              AND (:status IS NULL OR i.status = :status)
              AND (:q IS NULL OR i.name LIKE :q OR i.code LIKE :q OR i.presentation LIKE :q)
              AND (:lowStock = FALSE OR (i.minimum_stock > 0 AND COALESCE(st.total, 0) <= i.minimum_stock))
              AND (:unverified = FALSE OR COALESCE(st.unverified, 0) > 0)
            """;

    private static final String SELECT = """
            SELECT i.id, i.code, i.name, i.presentation, i.unit_name, i.minimum_stock, i.status,
                   m.code AS module_code, m.name AS module_name, m.color AS module_color,
                   COALESCE(st.total, 0) AS total, COALESCE(st.lots, 0) AS lots,
                   COALESCE(st.locations, 0) AS locations, COALESCE(st.unverified, 0) AS unverified,
                   EXISTS (SELECT 1 FROM item_images im WHERE im.item_id = i.id AND im.side = 'FRONT') AS has_front,
                   EXISTS (SELECT 1 FROM item_images im WHERE im.item_id = i.id AND im.side = 'BACK') AS has_back
            """;

    private static final RowMapper<ItemRow> ROW_MAPPER = (rs, n) -> {
        BigDecimal total = rs.getBigDecimal("total");
        BigDecimal minimum = rs.getBigDecimal("minimum_stock");
        return new ItemRow(rs.getLong("id"), rs.getString("code"), rs.getString("name"), rs.getString("presentation"),
                rs.getString("unit_name"), minimum, rs.getString("status"), rs.getString("module_code"),
                rs.getString("module_name"), rs.getString("module_color"), total, rs.getLong("lots"),
                rs.getLong("locations"), rs.getLong("unverified"), isLow(total, minimum),
                rs.getBoolean("has_front"), rs.getBoolean("has_back"));
    };

    private final NamedParameterJdbcTemplate jdbc;
    private final ItemRepository itemRepository;
    private final ItemImageRepository imageRepository;
    private final LotRepository lotRepository;
    private final StockRepository stockRepository;
    private final ModuleService moduleService;
    private final CurrentUserService currentUserService;

    /**
     * @param moduleCode NULL para todos los módulos
     * @param status     ACTIVO, INACTIVO o NULL para ambos
     */
    @Transactional(readOnly = true)
    public PageResponse<ItemRow> search(String moduleCode, String q, String status, boolean lowStock,
                                        boolean unverified, int page, int size) {
        int safeSize = Math.min(Math.max(size, 1), 200);
        int safePage = Math.max(page, 0);
        var params = new MapSqlParameterSource()
                .addValue("module", blankToNull(moduleCode))
                .addValue("status", blankToNull(status))
                .addValue("q", q == null || q.isBlank() ? null : "%" + q.trim() + "%")
                .addValue("lowStock", lowStock)
                .addValue("unverified", unverified)
                .addValue("limit", safeSize)
                .addValue("offset", safePage * safeSize);
        Long total = jdbc.queryForObject("SELECT COUNT(*) " + FROM_WHERE, params, Long.class);
        List<ItemRow> rows = jdbc.query(SELECT + FROM_WHERE
                + " ORDER BY i.name, i.presentation LIMIT :limit OFFSET :offset", params, ROW_MAPPER);
        return PageResponse.of(rows, safePage, safeSize, total == null ? 0 : total);
    }

    /** Todos los artículos activos que cumplen el filtro (para reportes), con un tope de seguridad. */
    @Transactional(readOnly = true)
    public List<ItemRow> listAll(String moduleCode, boolean lowStock) {
        var params = new MapSqlParameterSource()
                .addValue("module", blankToNull(moduleCode))
                .addValue("status", Item.ACTIVO)
                .addValue("q", null)
                .addValue("lowStock", lowStock)
                .addValue("unverified", false)
                .addValue("limit", 10000);
        return jdbc.query(SELECT + FROM_WHERE + " ORDER BY m.sort_order, i.name, i.presentation LIMIT :limit",
                params, ROW_MAPPER);
    }

    @Transactional(readOnly = true)
    public ItemDetailResponse detail(Long id) {
        Item item = itemRepository.findWithModule(id)
                .orElseThrow(() -> new ResourceNotFoundException("El artículo no existe."));

        Map<Long, List<StockView>> stockByLot = stockRepository.findByItem(id).stream()
                .map(StockView::from)
                .collect(Collectors.groupingBy(StockView::lotId, LinkedHashMap::new, Collectors.toList()));

        List<LotResponse> lots = new ArrayList<>();
        int emptyShown = 0;
        for (Lot lot : lotRepository.findByItem(id)) {
            List<StockView> stock = stockByLot.getOrDefault(lot.getId(), List.of());
            if (stock.isEmpty() && emptyShown++ >= EMPTY_LOTS_SHOWN) {
                continue;
            }
            lots.add(LotResponse.from(lot, stock));
        }

        BigDecimal total = lots.stream().map(LotResponse::total).reduce(BigDecimal.ZERO, BigDecimal::add);
        Map<String, String> images = new HashMap<>();
        jdbc.query("SELECT side, source FROM item_images WHERE item_id = :id",
                new MapSqlParameterSource("id", id), rs -> {
                    images.put(rs.getString("side"), rs.getString("source"));
                });

        List<ItemDetailResponse.Packaging> packagings = jdbc.query("""
                        SELECT container_name, units_per_container, COUNT(*) AS times
                        FROM movements
                        WHERE item_id = :id AND effect = 'ENTRADA' AND voided = FALSE
                          AND container_name IS NOT NULL AND units_per_container IS NOT NULL
                        GROUP BY container_name, units_per_container
                        ORDER BY MAX(created_at) DESC LIMIT 5""",
                new MapSqlParameterSource("id", id),
                (rs, n) -> new ItemDetailResponse.Packaging(rs.getString("container_name"),
                        rs.getBigDecimal("units_per_container"), rs.getLong("times")));

        return new ItemDetailResponse(item.getId(), item.getCode(), item.getName(), item.getPresentation(),
                item.getDescription(), item.getUnitName(), item.getMinimumStock(), item.getStatus(),
                moduleService.toResponse(item.getModule(), currentUserService.currentUser()), total,
                isLow(total, item.getMinimumStock()),
                images.containsKey(ItemImage.FRONT), images.containsKey(ItemImage.BACK),
                images.get(ItemImage.FRONT), images.get(ItemImage.BACK),
                item.getLastContainerName(), item.getLastUnitsPerContainer(), packagings, lots,
                item.getCreatedBy() == null ? null : item.getCreatedBy().getFullName(),
                item.getCreatedAt(), item.getUpdatedAt());
    }

    /** Stock bajo: hay un mínimo configurado y el total llegó a él o está por debajo. */
    public static boolean isLow(BigDecimal total, BigDecimal minimum) {
        return minimum != null && minimum.signum() > 0 && total != null && total.compareTo(minimum) <= 0;
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
