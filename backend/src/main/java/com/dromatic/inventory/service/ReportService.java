package com.dromatic.inventory.service;

import com.dromatic.inventory.dto.MovementResponse;
import com.dromatic.inventory.dto.ProductResponse;
import com.dromatic.inventory.exception.BusinessException;
import com.dromatic.inventory.model.MovementType;
import com.dromatic.inventory.model.ProductStatus;
import com.itextpdf.kernel.colors.Color;
import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.kernel.geom.PageSize;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.borders.Border;
import com.itextpdf.layout.borders.SolidBorder;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import com.itextpdf.layout.properties.VerticalAlignment;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.function.Consumer;

@Service
@RequiredArgsConstructor
public class ReportService {

    private static final DateTimeFormatter DATE_TIME = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
    private static final DateTimeFormatter DATE = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final Color NAVY = new DeviceRgb(30, 58, 95);
    private static final Color ZEBRA = new DeviceRgb(245, 247, 250);
    private static final Color RED = new DeviceRgb(198, 40, 40);
    private static final Color GREEN = new DeviceRgb(46, 125, 50);
    private static final Color MUTED = new DeviceRgb(110, 110, 110);

    private final ProductService productService;
    private final MovementService movementService;

    public byte[] generateInventoryReport(String username) {
        List<ProductResponse> products = productService.search(null, null);
        return buildProductReport("Reporte general de inventario", "Todos los productos", products, username);
    }

    public byte[] generateLowStockReport(String username) {
        List<ProductResponse> products = productService.findLowStock();
        return buildProductReport("Reporte de productos con stock bajo",
                "Productos activos con stock igual o menor al mínimo", products, username);
    }

    public byte[] generateMovementsReport(Long productId, LocalDate start, LocalDate end, MovementType type,
                                          String username) {
        if (start != null && end != null && start.isAfter(end)) {
            throw new BusinessException("La fecha inicial no puede ser mayor que la fecha final.");
        }
        List<MovementResponse> movements = movementService.search(productId, start, end, type);

        String productFilter = "Todos";
        if (productId != null) {
            ProductResponse product = productService.findById(productId);
            productFilter = product.getCode() + " - " + product.getName();
        }
        String filters = "Desde: " + (start != null ? start.format(DATE) : "inicio") +
                "   Hasta: " + (end != null ? end.format(DATE) : "hoy") +
                "   Tipo: " + (type != null ? type.name() : "Entradas y salidas") +
                "   Producto: " + productFilter;

        return render(PageSize.A4.rotate(), document -> {
            addHeader(document, "Reporte de movimientos de inventario", filters, username);

            long entries = 0, exits = 0, voided = 0;
            for (MovementResponse m : movements) {
                if (m.isVoided()) voided++;
                else if (MovementType.ENTRADA.name().equals(m.getType())) entries += m.getQuantity();
                else exits += m.getQuantity();
            }
            addSummary(document, new String[][]{
                    {"Movimientos", String.valueOf(movements.size())},
                    {"Unidades que entraron", String.valueOf(entries)},
                    {"Unidades que salieron", String.valueOf(exits)},
                    {"Movimientos anulados", String.valueOf(voided)}
            });

            Table table = newTable(new float[]{1.3f, 1.2f, 1.4f, 3f, 0.9f, 2f, 1.3f, 1.3f, 1.4f},
                    "Fecha", "Tipo", "Código", "Producto", "Cant.", "Motivo", "Documento", "Usuario", "Estado");
            int row = 0;
            for (MovementResponse m : movements) {
                boolean zebra = row++ % 2 == 1;
                addCell(table, m.getMovementDate().format(DATE), zebra);
                Cell typeCell = addCell(table, m.getType(), zebra);
                typeCell.setFontColor(MovementType.ENTRADA.name().equals(m.getType()) ? GREEN : RED).setBold();
                addCell(table, m.getProductCode(), zebra);
                addCell(table, m.getProductName(), zebra);
                addCell(table, String.valueOf(m.getQuantity()), zebra).setTextAlignment(TextAlignment.RIGHT);
                addCell(table, nvl(m.getReason()), zebra);
                addCell(table, nvl(m.getReference()), zebra);
                addCell(table, m.getUsername(), zebra);
                Cell status = addCell(table, m.isVoided() ? "ANULADO por " + m.getVoidedBy() : "Vigente", zebra);
                if (m.isVoided()) status.setFontColor(RED);
            }
            addTableOrEmpty(document, table, movements.isEmpty(), "No hay movimientos para los filtros seleccionados.");
        });
    }

    private byte[] buildProductReport(String title, String filters, List<ProductResponse> products, String username) {
        return render(PageSize.A4, document -> {
            addHeader(document, title, filters, username);

            long units = products.stream().mapToLong(ProductResponse::getQuantity).sum();
            long low = products.stream().filter(p -> p.isLowStock() && ProductStatus.ACTIVO.name().equals(p.getStatus())).count();
            addSummary(document, new String[][]{
                    {"Productos", String.valueOf(products.size())},
                    {"Unidades", String.valueOf(units)},
                    {"Con stock bajo", String.valueOf(low)}
            });

            Table table = newTable(new float[]{1.4f, 3f, 1.1f, 1.3f, 2.8f, 1.4f},
                    "Código", "Producto", "Cantidad", "Stock mín.", "Ubicación", "Estado");
            int row = 0;
            for (ProductResponse p : products) {
                boolean zebra = row++ % 2 == 1;
                addCell(table, p.getCode(), zebra);
                addCell(table, p.getName(), zebra);
                Cell qty = addCell(table, String.valueOf(p.getQuantity()), zebra).setTextAlignment(TextAlignment.RIGHT);
                addCell(table, String.valueOf(p.getMinimumStock()), zebra).setTextAlignment(TextAlignment.RIGHT);
                addCell(table, p.getLocationLabel(), zebra);
                String state;
                if (ProductStatus.INACTIVO.name().equals(p.getStatus())) state = "Inactivo";
                else if (p.getQuantity() == 0) state = "Agotado";
                else if (p.isLowStock()) state = "Stock bajo";
                else state = "Disponible";
                Cell stateCell = addCell(table, state, zebra);
                if (p.isLowStock() && !"Inactivo".equals(state)) {
                    stateCell.setFontColor(RED).setBold();
                    qty.setFontColor(RED).setBold();
                }
            }
            addTableOrEmpty(document, table, products.isEmpty(), "No hay productos para mostrar.");
        });
    }

    private byte[] render(PageSize pageSize, Consumer<Document> content) {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            PdfDocument pdf = new PdfDocument(new PdfWriter(out));
            Document document = new Document(pdf, pageSize, false);
            document.setMargins(36, 32, 40, 32);

            content.accept(document);

            int pages = pdf.getNumberOfPages();
            for (int i = 1; i <= pages; i++) {
                float x = pdf.getPage(i).getPageSize().getWidth() / 2;
                document.showTextAligned(new Paragraph("Dromatic Inventory System  ·  Página " + i + " de " + pages)
                                .setFontSize(8).setFontColor(MUTED),
                        x, 20, i, TextAlignment.CENTER, VerticalAlignment.BOTTOM, 0);
            }
            document.close();
            return out.toByteArray();
        } catch (Exception e) {
            throw new IllegalStateException("No se pudo generar el reporte PDF.", e);
        }
    }

    private void addHeader(Document document, String title, String filters, String username) {
        document.add(new Paragraph("LABORATORIO DRÒMATIC · BODEGA PRINCIPAL")
                .setFontSize(9).setFontColor(MUTED).setBold().setMarginBottom(0));
        document.add(new Paragraph("Dromatic Inventory System (DIS)")
                .setFontSize(18).setBold().setFontColor(NAVY).setMarginTop(0).setMarginBottom(0));
        document.add(new Paragraph(title).setFontSize(13).setBold().setMarginTop(2).setMarginBottom(6));
        document.add(new Paragraph("Generado el " + LocalDateTime.now().format(DATE_TIME) + " por " + username)
                .setFontSize(9).setFontColor(MUTED).setMargin(0));
        document.add(new Paragraph("Filtros: " + filters).setFontSize(9).setFontColor(MUTED).setMarginTop(0)
                .setMarginBottom(10).setBorderBottom(new SolidBorder(NAVY, 1.5f)).setPaddingBottom(6));
    }

    private void addSummary(Document document, String[][] values) {
        Table summary = new Table(UnitValue.createPercentArray(values.length)).useAllAvailableWidth().setMarginBottom(12);
        for (String[] item : values) {
            summary.addCell(new Cell().setBorder(Border.NO_BORDER).setBackgroundColor(ZEBRA).setPadding(6)
                    .add(new Paragraph(item[1]).setFontSize(14).setBold().setFontColor(NAVY).setMargin(0))
                    .add(new Paragraph(item[0]).setFontSize(8).setFontColor(MUTED).setMargin(0)));
        }
        document.add(summary);
    }

    private Table newTable(float[] widths, String... headers) {
        Table table = new Table(UnitValue.createPercentArray(widths)).useAllAvailableWidth();
        for (String header : headers) {
            table.addHeaderCell(new Cell().setBackgroundColor(NAVY).setBorder(Border.NO_BORDER).setPadding(5)
                    .add(new Paragraph(header).setBold().setFontSize(9).setFontColor(ColorConstants.WHITE)));
        }
        return table;
    }

    private Cell addCell(Table table, String text, boolean zebra) {
        Cell cell = new Cell().setBorder(Border.NO_BORDER).setPadding(4).setFontSize(9)
                .add(new Paragraph(text == null ? "" : text));
        if (zebra) cell.setBackgroundColor(ZEBRA);
        table.addCell(cell);
        return cell;
    }

    private void addTableOrEmpty(Document document, Table table, boolean empty, String emptyMessage) {
        if (empty) {
            document.add(new Paragraph(emptyMessage).setFontSize(10).setFontColor(MUTED).setItalic());
        } else {
            document.add(table);
        }
    }

    private static String nvl(String value) {
        return value == null ? "—" : value;
    }
}
