package com.dromatic.inventory.report;

import com.dromatic.inventory.common.exception.BusinessException;
import com.dromatic.inventory.config.AppProperties;
import com.dromatic.inventory.item.ItemRow;
import com.dromatic.inventory.item.ItemQueryService;
import com.dromatic.inventory.module.InventoryModule;
import com.dromatic.inventory.module.ModuleService;
import com.dromatic.inventory.movement.MovementEffect;
import com.dromatic.inventory.movement.MovementQueryService;
import com.dromatic.inventory.movement.MovementResponse;
import com.dromatic.inventory.security.CurrentUserService;
import com.itextpdf.kernel.geom.PageSize;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.TextAlignment;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.*;

import static com.dromatic.inventory.common.text.Numbers.format;
import static com.dromatic.inventory.report.PdfReport.*;

/** Reportes de inventario y de movimientos, en PDF para imprimir o CSV para Excel. */
@Service
@RequiredArgsConstructor
public class ReportService {

    private static final int MAX_MOVEMENTS = 5000;
    private static final String FOOTER = "Sistema de inventario DIS";

    private final ItemQueryService itemQueryService;
    private final MovementQueryService movementQueryService;
    private final ModuleService moduleService;
    private final CurrentUserService currentUserService;
    private final AppProperties appProperties;
    private final NamedParameterJdbcTemplate jdbc;

    // ─── Inventario ─────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public byte[] inventoryPdf(String module, boolean lowStock) {
        List<ItemRow> rows = itemQueryService.listAll(module, lowStock);
        Map<Long, List<String>> locations = locationsByItem();
        String title = (lowStock ? "Artículos con stock bajo" : "Inventario") + " · " + moduleLabel(module);
        String user = currentUserService.currentUser().getFullName();
        return render(PageSize.A4.rotate(), FOOTER, doc -> {
            header(doc, appProperties.company().name(), title,
                    lowStock ? "Artículos activos con cantidad igual o menor al mínimo" : "Artículos activos", user);
            summary(doc, new String[][]{
                    {"Artículos", String.valueOf(rows.size())},
                    {"Con existencia", String.valueOf(rows.stream().filter(r -> r.total().signum() > 0).count())},
                    {"Con stock bajo", String.valueOf(rows.stream().filter(ItemRow::lowStock).count())},
                    {"Rótulos por verificar", String.valueOf(rows.stream().mapToLong(ItemRow::unverified).sum())}
            });
            Table table = table(new float[]{1.3f, 3.2f, 1.2f, 1.3f, 1.1f, 0.8f, 3.4f, 1.1f},
                    "Módulo", "Artículo", "Cantidad", "Unidad", "Mínimo", "Rótulos", "Ubicaciones", "Estado");
            int i = 0;
            for (ItemRow r : rows) {
                boolean zebra = i++ % 2 == 1;
                cell(table, r.moduleName(), zebra);
                cell(table, name(r), zebra);
                Cell qty = cell(table, format(r.total()), zebra).setTextAlignment(TextAlignment.RIGHT);
                cell(table, r.unitName(), zebra);
                cell(table, r.minimumStock().signum() > 0 ? format(r.minimumStock()) : "—", zebra)
                        .setTextAlignment(TextAlignment.RIGHT);
                cell(table, String.valueOf(r.lots()), zebra).setTextAlignment(TextAlignment.RIGHT);
                cell(table, String.join(", ", locations.getOrDefault(r.id(), List.of())), zebra);
                Cell state = cell(table, state(r), zebra);
                if (r.lowStock()) {
                    qty.setFontColor(RED).setBold();
                    state.setFontColor(RED).setBold();
                }
            }
            tableOrEmpty(doc, table, rows.isEmpty(), "No hay artículos para mostrar.");
        });
    }

    @Transactional(readOnly = true)
    public byte[] inventoryCsv(String module, boolean lowStock) {
        Map<Long, List<String>> locations = locationsByItem();
        StringBuilder csv = new StringBuilder();
        line(csv, "Módulo", "Código", "Artículo", "Presentación", "Cantidad", "Unidad", "Mínimo", "Rótulos",
                "Ubicaciones", "Rótulos por verificar", "Estado");
        for (ItemRow r : itemQueryService.listAll(module, lowStock)) {
            line(csv, r.moduleName(), r.code(), r.name(), r.presentation(), plain(r.total()), r.unitName(),
                    plain(r.minimumStock()), String.valueOf(r.lots()),
                    String.join(", ", locations.getOrDefault(r.id(), List.of())), String.valueOf(r.unverified()), state(r));
        }
        return withBom(csv);
    }

    // ─── Movimientos ────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public byte[] movementsPdf(MovementQueryService.Filter filter) {
        validate(filter);
        List<MovementResponse> movements = movementQueryService.all(filter, MAX_MOVEMENTS);
        String user = currentUserService.currentUser().getFullName();
        return render(PageSize.A4.rotate(), FOOTER, doc -> {
            header(doc, appProperties.company().name(), "Movimientos · " + moduleLabel(filter.module()),
                    describe(filter), user);
            summary(doc, new String[][]{
                    {"Movimientos", String.valueOf(movements.size())},
                    {"Entradas", count(movements, MovementEffect.ENTRADA)},
                    {"Salidas", count(movements, MovementEffect.SALIDA)},
                    {"Traslados y ajustes", String.valueOf(movements.stream().filter(m -> !m.voided()
                            && (m.effect() == MovementEffect.TRASLADO || m.effect() == MovementEffect.AJUSTE)).count())},
                    {"Anulados", String.valueOf(movements.stream().filter(MovementResponse::voided).count())}
            });
            Table table = table(new float[]{1f, 1.4f, 2.8f, 1.1f, 1f, 2.2f, 2.2f, 1.8f, 1.4f},
                    "Fecha", "Tipo", "Artículo", "Lote", "Cantidad", "Desde", "Hacia", "Motivo", "Registró");
            int i = 0;
            for (MovementResponse m : movements) {
                boolean zebra = i++ % 2 == 1;
                cell(table, m.movementDate().format(DATE), zebra);
                Cell type = cell(table, m.movementType() + (m.voided() ? " (ANULADO)" : ""), zebra).setBold();
                type.setFontColor(m.voided() ? MUTED : m.stockDelta().signum() > 0 ? GREEN
                        : m.stockDelta().signum() < 0 ? RED : TEAL);
                cell(table, m.itemName() + (m.presentation() == null ? "" : " " + m.presentation()), zebra);
                cell(table, m.lotNumber(), zebra);
                cell(table, signed(m) + " " + m.unitName(), zebra).setTextAlignment(TextAlignment.RIGHT);
                cell(table, m.fromLocation(), zebra);
                cell(table, m.toLocation(), zebra);
                cell(table, m.reason(), zebra);
                cell(table, m.createdBy(), zebra);
            }
            tableOrEmpty(doc, table, movements.isEmpty(), "No hay movimientos para los filtros seleccionados.");
        });
    }

    @Transactional(readOnly = true)
    public byte[] movementsCsv(MovementQueryService.Filter filter) {
        validate(filter);
        StringBuilder csv = new StringBuilder();
        line(csv, "Fecha", "Registrado", "Efecto", "Tipo de movimiento", "Módulo", "Artículo", "Presentación", "Lote",
                "Cantidad", "Unidad", "Contenedores", "Contenedor", "Unidades por contenedor", "Peso kg", "Desde",
                "Hacia", "Motivo", "Nota", "Referencia", "Registró", "Anulado", "Motivo de anulación");
        for (MovementResponse m : movementQueryService.all(filter, MAX_MOVEMENTS)) {
            line(csv, m.movementDate().format(DATE), m.createdAt().format(DATE_TIME), m.effect().name(),
                    m.movementType(), m.moduleName(), m.itemName(), m.presentation(), m.lotNumber(),
                    plain(m.stockDelta().signum() == 0 ? m.quantity() : m.stockDelta()), m.unitName(),
                    plain(m.containers()), m.containerName(), plain(m.unitsPerContainer()), plain(m.weightKg()),
                    m.fromLocation(), m.toLocation(), m.reason(), m.note(), m.reference(), m.createdBy(),
                    m.voided() ? "Sí" : "No", m.voidReason());
        }
        return withBom(csv);
    }

    // ─── Ayudas ─────────────────────────────────────────────────────────

    /** Artículo → ubicaciones cortas ("P4-C2", "Z1I-B3" o la ubicación escrita). */
    private Map<Long, List<String>> locationsByItem() {
        Map<Long, List<String>> result = new HashMap<>();
        jdbc.query("""
                SELECT l.item_id, COALESCE(CONCAT(ms.code, '-', r.code, s.level), s.location_note, 'Sin ubicación') AS loc
                FROM stock s JOIN lots l ON l.id = s.lot_id
                LEFT JOIN racks r ON r.id = s.rack_id LEFT JOIN map_sections ms ON ms.id = r.section_id
                WHERE s.quantity > 0
                ORDER BY l.item_id, ms.sort_order, r.position, s.level""", new MapSqlParameterSource(), rs -> {
            List<String> list = result.computeIfAbsent(rs.getLong("item_id"), k -> new ArrayList<>());
            String loc = rs.getString("loc");
            if (!list.contains(loc)) {
                list.add(loc);
            }
        });
        return result;
    }

    private String moduleLabel(String code) {
        if (code == null || code.isBlank()) {
            return "Todos los módulos";
        }
        InventoryModule module = moduleService.getByCode(code.toUpperCase(Locale.ROOT));
        return module.getName();
    }

    private static void validate(MovementQueryService.Filter f) {
        if (f.dateFrom() != null && f.dateTo() != null && f.dateFrom().isAfter(f.dateTo())) {
            throw new BusinessException("La fecha inicial no puede ser mayor que la fecha final.");
        }
    }

    private static String describe(MovementQueryService.Filter f) {
        return "Desde: " + (f.dateFrom() == null ? "el inicio" : f.dateFrom().format(DATE))
                + "   Hasta: " + (f.dateTo() == null ? "hoy" : f.dateTo().format(DATE))
                + (f.effect() == null ? "" : "   Efecto: " + f.effect().name().toLowerCase(Locale.ROOT));
    }

    private static String count(List<MovementResponse> list, MovementEffect effect) {
        return String.valueOf(list.stream().filter(m -> !m.voided() && m.effect() == effect).count());
    }

    private static String signed(MovementResponse m) {
        int sign = m.stockDelta().signum();
        return (sign > 0 ? "+" : sign < 0 ? "-" : "") + format(m.quantity());
    }

    private static String name(ItemRow r) {
        return r.presentation() == null ? r.name() : r.name() + " " + r.presentation();
    }

    private static String state(ItemRow r) {
        if (r.total().signum() == 0) {
            return "Agotado";
        }
        return r.lowStock() ? "Stock bajo" : "Disponible";
    }

    private static String plain(BigDecimal value) {
        return value == null ? "" : value.stripTrailingZeros().toPlainString().replace('.', ',');
    }

    /** Excel en español usa punto y coma como separador. */
    private static void line(StringBuilder csv, String... values) {
        StringJoiner joiner = new StringJoiner(";");
        for (String v : values) {
            String value = v == null ? "" : v;
            joiner.add(value.contains(";") || value.contains("\"") || value.contains("\n")
                    ? "\"" + value.replace("\"", "\"\"") + "\"" : value);
        }
        csv.append(joiner).append("\r\n");
    }

    /** La marca BOM hace que Excel abra bien las tildes. */
    private static byte[] withBom(StringBuilder csv) {
        return ("﻿" + csv).getBytes(StandardCharsets.UTF_8);
    }
}
