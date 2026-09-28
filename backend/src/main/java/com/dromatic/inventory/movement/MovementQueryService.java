package com.dromatic.inventory.movement;

import com.dromatic.inventory.common.exception.ResourceNotFoundException;
import com.dromatic.inventory.common.web.PageResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Date;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.util.List;
import java.util.Locale;

/** Historial de movimientos con filtros, para pantallas y reportes. */
@Service
@RequiredArgsConstructor
public class MovementQueryService {

    private static final String FROM = """
            FROM movements mv
            JOIN items i ON i.id = mv.item_id
            JOIN inventory_modules md ON md.id = i.module_id
            JOIN lots l ON l.id = mv.lot_id
            JOIN users cu ON cu.id = mv.created_by
            LEFT JOIN users vu ON vu.id = mv.voided_by
            LEFT JOIN racks fr ON fr.id = mv.from_rack_id
            LEFT JOIN map_sections fs ON fs.id = fr.section_id
            LEFT JOIN map_areas fa ON fa.id = fs.area_id
            LEFT JOIN racks tr ON tr.id = mv.to_rack_id
            LEFT JOIN map_sections ts ON ts.id = tr.section_id
            LEFT JOIN map_areas ta ON ta.id = ts.area_id
            WHERE (:module IS NULL OR md.code = :module)
              AND (:itemId IS NULL OR mv.item_id = :itemId)
              AND (:lotId IS NULL OR mv.lot_id = :lotId)
              AND (:effect IS NULL OR mv.effect = :effect)
              AND (:dateFrom IS NULL OR mv.movement_date >= :dateFrom)
              AND (:dateTo IS NULL OR mv.movement_date <= :dateTo)
              AND (:q IS NULL OR i.name LIKE :q OR l.lot_number LIKE :q OR mv.movement_type LIKE :q
                   OR mv.reason LIKE :q OR mv.reference LIKE :q OR cu.full_name LIKE :q)
              AND (:includeVoided = TRUE OR mv.voided = FALSE)
              AND (:id IS NULL OR mv.id = :id)
            """;

    private static final String SELECT = """
            SELECT mv.*, i.name AS item_name, i.presentation, md.code AS module_code, md.name AS module_name,
                   md.color AS module_color, l.lot_number, l.label_date,
                   CONCAT(fa.name, ' · ', fs.name, ' · ', fr.code, mv.from_level) AS from_location,
                   CONCAT(ta.name, ' · ', ts.name, ' · ', tr.code, mv.to_level) AS to_location,
                   cu.full_name AS created_by_name, vu.full_name AS voided_by_name
            """;

    private static final RowMapper<MovementResponse> MAPPER = MovementQueryService::map;

    private final NamedParameterJdbcTemplate jdbc;

    /** Filtros opcionales; {@code page} empieza en 0. */
    public record Filter(String module, Long itemId, Long lotId, MovementEffect effect, LocalDate dateFrom,
                         LocalDate dateTo, String q, boolean includeVoided) {
    }

    @Transactional(readOnly = true)
    public PageResponse<MovementResponse> search(Filter f, int page, int size) {
        int safeSize = Math.min(Math.max(size, 1), 500);
        int safePage = Math.max(page, 0);
        var params = params(f, null).addValue("limit", safeSize).addValue("offset", safePage * safeSize);
        Long total = jdbc.queryForObject("SELECT COUNT(*) " + FROM, params, Long.class);
        List<MovementResponse> rows = jdbc.query(SELECT + FROM
                + " ORDER BY mv.movement_date DESC, mv.id DESC LIMIT :limit OFFSET :offset", params, MAPPER);
        return PageResponse.of(rows, safePage, safeSize, total == null ? 0 : total);
    }

    /** Todos los que cumplan el filtro (para reportes), con un tope de seguridad. */
    @Transactional(readOnly = true)
    public List<MovementResponse> all(Filter f, int max) {
        var params = params(f, null).addValue("limit", max);
        return jdbc.query(SELECT + FROM + " ORDER BY mv.movement_date DESC, mv.id DESC LIMIT :limit", params, MAPPER);
    }

    @Transactional(readOnly = true)
    public MovementResponse get(Long id) {
        var params = params(new Filter(null, null, null, null, null, null, null, true), id);
        return jdbc.query(SELECT + FROM, params, MAPPER).stream().findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("El movimiento no existe."));
    }

    @Transactional(readOnly = true)
    public List<MovementResponse> get(List<Long> ids) {
        return ids.stream().map(this::get).toList();
    }

    private static MapSqlParameterSource params(Filter f, Long id) {
        return new MapSqlParameterSource()
                .addValue("module", f.module() == null || f.module().isBlank() ? null : f.module().toUpperCase(Locale.ROOT))
                .addValue("itemId", f.itemId())
                .addValue("lotId", f.lotId())
                .addValue("effect", f.effect() == null ? null : f.effect().name())
                .addValue("dateFrom", f.dateFrom() == null ? null : Date.valueOf(f.dateFrom()))
                .addValue("dateTo", f.dateTo() == null ? null : Date.valueOf(f.dateTo()))
                .addValue("q", f.q() == null || f.q().isBlank() ? null : "%" + f.q().trim() + "%")
                .addValue("includeVoided", f.includeVoided())
                .addValue("id", id);
    }

    private static MovementResponse map(ResultSet rs, int n) throws SQLException {
        Timestamp voidedAt = rs.getTimestamp("voided_at");
        Date labelDate = rs.getDate("label_date");
        return new MovementResponse(
                rs.getLong("id"),
                MovementEffect.valueOf(rs.getString("effect")),
                rs.getString("movement_type"),
                rs.getLong("item_id"),
                rs.getString("item_name"),
                rs.getString("presentation"),
                rs.getString("module_code"),
                rs.getString("module_name"),
                rs.getString("module_color"),
                rs.getLong("lot_id"),
                rs.getString("lot_number"),
                labelDate == null ? null : labelDate.toLocalDate(),
                rs.getBigDecimal("quantity"),
                rs.getBigDecimal("stock_delta"),
                rs.getString("unit_name"),
                rs.getBigDecimal("containers"),
                rs.getString("container_name"),
                rs.getBigDecimal("units_per_container"),
                rs.getBigDecimal("weight_kg"),
                (Long) rs.getObject("from_rack_id", Long.class),
                (Integer) rs.getObject("from_level", Integer.class),
                location(rs.getString("from_location"), rs.getString("from_note")),
                (Long) rs.getObject("to_rack_id", Long.class),
                (Integer) rs.getObject("to_level", Integer.class),
                location(rs.getString("to_location"), rs.getString("to_note")),
                rs.getString("reason"),
                rs.getString("note"),
                rs.getString("reference"),
                rs.getDate("movement_date").toLocalDate(),
                rs.getString("created_by_name"),
                rs.getTimestamp("created_at").toLocalDateTime(),
                rs.getBoolean("voided"),
                voidedAt == null ? null : voidedAt.toLocalDateTime(),
                rs.getString("voided_by_name"),
                rs.getString("void_reason"));
    }

    private static String location(String mapLocation, String note) {
        return mapLocation != null ? mapLocation : note;
    }
}
