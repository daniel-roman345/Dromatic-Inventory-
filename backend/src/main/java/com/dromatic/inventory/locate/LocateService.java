package com.dromatic.inventory.locate;

import com.dromatic.inventory.lot.StockView;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Date;
import java.util.List;
import java.util.Locale;

/**
 * "¿Dónde está?": busca por nombre, código, presentación, número de lote o
 * proveedor y devuelve cada ubicación para marcarla en el mapa.
 */
@Service
@RequiredArgsConstructor
public class LocateService {

    private static final int MAX_RESULTS = 150;

    private static final String SQL = """
            SELECT s.id AS stock_id, i.id AS item_id, i.name AS item_name, i.presentation, i.unit_name,
                   m.code AS module_code, m.name AS module_name, m.color AS module_color,
                   l.id AS lot_id, l.lot_number, l.label_date, l.supplier, l.verified,
                   s.quantity, s.container_name, s.units_per_container, s.rack_id, s.level, s.location_note,
                   a.code AS area_code, a.name AS area_name, ms.code AS section_code, ms.name AS section_name,
                   r.code AS rack_code
            FROM stock s
            JOIN lots l ON l.id = s.lot_id
            JOIN items i ON i.id = l.item_id
            JOIN inventory_modules m ON m.id = i.module_id
            LEFT JOIN racks r ON r.id = s.rack_id
            LEFT JOIN map_sections ms ON ms.id = r.section_id
            LEFT JOIN map_areas a ON a.id = ms.area_id
            WHERE s.quantity > 0
              AND (:module IS NULL OR m.code = :module)
              AND (i.name LIKE :q OR i.code LIKE :q OR i.presentation LIKE :q OR l.lot_number LIKE :q
                   OR l.supplier LIKE :q OR CONCAT(i.name, ' ', COALESCE(i.presentation, '')) LIKE :q)
            ORDER BY i.name, i.presentation, a.code, ms.sort_order, r.position, s.level
            LIMIT :max""";

    private final NamedParameterJdbcTemplate jdbc;

    @Transactional(readOnly = true)
    public List<LocateResult> search(String q, String module) {
        if (q == null || q.trim().length() < 2) {
            return List.of();
        }
        var params = new MapSqlParameterSource()
                .addValue("q", "%" + q.trim() + "%")
                .addValue("module", module == null || module.isBlank() ? null : module.toUpperCase(Locale.ROOT))
                .addValue("max", MAX_RESULTS);
        return jdbc.query(SQL, params, (rs, n) -> {
            String areaCode = rs.getString("area_code");
            Integer level = (Integer) rs.getObject("level", Integer.class);
            String rackCode = rs.getString("rack_code");
            String note = rs.getString("location_note");
            Date labelDate = rs.getDate("label_date");
            String code = areaCode == null ? null : areaCode + "-" + rs.getString("section_code") + "-" + rackCode + level;
            String name = areaCode == null ? (note == null ? StockView.NO_LOCATION : note)
                    : rs.getString("area_name") + " · " + rs.getString("section_name") + " · " + rackCode + level;
            return new LocateResult(rs.getLong("stock_id"), rs.getLong("item_id"), rs.getString("item_name"),
                    rs.getString("presentation"), rs.getString("unit_name"), rs.getString("module_code"),
                    rs.getString("module_name"), rs.getString("module_color"), rs.getLong("lot_id"),
                    rs.getString("lot_number"), labelDate == null ? null : labelDate.toLocalDate(),
                    rs.getString("supplier"), rs.getBoolean("verified"), rs.getBigDecimal("quantity"),
                    rs.getString("container_name"), rs.getBigDecimal("units_per_container"),
                    (Long) rs.getObject("rack_id", Long.class), level, areaCode, code, name);
        });
    }
}
