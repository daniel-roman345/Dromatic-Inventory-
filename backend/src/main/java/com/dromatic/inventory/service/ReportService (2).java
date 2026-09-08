package com.dromatic.inventory.service;

import com.dromatic.inventory.dto.MovementResponse;
import com.dromatic.inventory.dto.ProductResponse;
import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.UnitValue;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final ProductService productService;
    private final MovementService movementService;

    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    public byte[] generateInventoryReport() {
        List<ProductResponse> products = productService.findAll();
        return buildInventoryPdf("Reporte General de Inventario", products, "Ninguno");
    }

    public byte[] generateLowStockReport() {
        List<ProductResponse> products = productService.findLowStock();
        return buildInventoryPdf("Reporte de Productos con Stock Bajo", products, "Stock bajo");
    }

    public byte[] generateMovementsReport(Long productId, LocalDate start, LocalDate end, String type) {
        var movementType = type != null ? com.dromatic.inventory.model.MovementType.valueOf(type) : null;
        List<MovementResponse> movements = movementService.findByFilters(productId, start, end, movementType);

        String filtros = "Producto=" + (productId != null ? productId : "Todos")
                + ", Fecha inicial=" + (start != null ? start : "N/A")
                + ", Fecha final=" + (end != null ? end : "N/A")
                + ", Tipo=" + (type != null ? type : "Todos");

        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            PdfWriter writer = new PdfWriter(baos);
            PdfDocument pdf = new PdfDocument(writer);
            Document document = new Document(pdf);

            addHeader(document, "Reporte de Movimientos", filtros);

            Table table = new Table(UnitValue.createPercentArray(new float[]{2, 2, 1, 1, 1, 2}));
            table.setWidth(UnitValue.createPercentValue(100));
            addHeaderCell(table, "Código");
            addHeaderCell(table, "Producto");
            addHeaderCell(table, "Tipo");
            addHeaderCell(table, "Cantidad");
            addHeaderCell(table, "Fecha");
            addHeaderCell(table, "Usuario");

            for (MovementResponse m : movements) {
                table.addCell(new Cell().add(new Paragraph(m.getProductCode())));
                table.addCell(new Cell().add(new Paragraph(m.getProductName())));
                table.addCell(new Cell().add(new Paragraph(m.getType())));
                table.addCell(new Cell().add(new Paragraph(String.valueOf(m.getQuantity()))));
                table.addCell(new Cell().add(new Paragraph(String.valueOf(m.getMovementDate()))));
                table.addCell(new Cell().add(new Paragraph(m.getUsername())));
            }

            document.add(table);
            document.close();
            return baos.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Error generando el reporte PDF: " + e.getMessage(), e);
        }
    }

    private byte[] buildInventoryPdf(String title, List<ProductResponse> products, String filtroExtra) {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            PdfWriter writer = new PdfWriter(baos);
            PdfDocument pdf = new PdfDocument(writer);
            Document document = new Document(pdf);

            addHeader(document, title, "Filtro=" + filtroExtra);

            Table table = new Table(UnitValue.createPercentArray(new float[]{1, 2, 1, 1, 2, 1}));
            table.setWidth(UnitValue.createPercentValue(100));
            addHeaderCell(table, "Código");
            addHeaderCell(table, "Nombre");
            addHeaderCell(table, "Cantidad");
            addHeaderCell(table, "Stock mín.");
            addHeaderCell(table, "Ubicación");
            addHeaderCell(table, "Estado");

            for (ProductResponse p : products) {
                table.addCell(new Cell().add(new Paragraph(p.getCode())));
                table.addCell(new Cell().add(new Paragraph(p.getName())));
                table.addCell(new Cell().add(new Paragraph(String.valueOf(p.getQuantity()))));
                table.addCell(new Cell().add(new Paragraph(String.valueOf(p.getMinimumStock()))));
                table.addCell(new Cell().add(new Paragraph(p.getLocationLabel())));
                table.addCell(new Cell().add(new Paragraph(p.isLowStock() ? "Stock bajo" : "Stock disponible")));
            }

            document.add(table);
            document.close();
            return baos.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Error generando el reporte PDF: " + e.getMessage(), e);
        }
    }

    private void addHeader(Document document, String title, String filtros) {
        document.add(new Paragraph("Dromatic Inventory System").setBold().setFontSize(16));
        document.add(new Paragraph(title).setFontSize(13));
        document.add(new Paragraph("Fecha de generación: " + LocalDateTime.now().format(FMT)).setFontSize(9));
        document.add(new Paragraph("Filtros utilizados: " + filtros).setFontSize(9));
        document.add(new Paragraph(" "));
    }

    private void addHeaderCell(Table table, String text) {
        table.addHeaderCell(new Cell()
                .add(new Paragraph(text).setBold())
                .setBackgroundColor(ColorConstants.LIGHT_GRAY));
    }
}
