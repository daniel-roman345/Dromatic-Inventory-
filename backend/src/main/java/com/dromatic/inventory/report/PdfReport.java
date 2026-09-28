package com.dromatic.inventory.report;

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

import java.io.ByteArrayOutputStream;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.function.Consumer;

/** Piezas comunes de los reportes PDF: encabezado de la empresa, resumen, tablas y pie de página. */
final class PdfReport {

    static final DateTimeFormatter DATE_TIME = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
    static final DateTimeFormatter DATE = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    static final Color TEAL = new DeviceRgb(15, 118, 110);
    static final Color ZEBRA = new DeviceRgb(244, 247, 246);
    static final Color RED = new DeviceRgb(180, 35, 24);
    static final Color GREEN = new DeviceRgb(22, 128, 61);
    static final Color MUTED = new DeviceRgb(107, 114, 128);

    private PdfReport() {
    }

    static byte[] render(PageSize pageSize, String footer, Consumer<Document> content) {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            PdfDocument pdf = new PdfDocument(new PdfWriter(out));
            Document document = new Document(pdf, pageSize, false);
            document.setMargins(36, 32, 40, 32);
            content.accept(document);
            int pages = pdf.getNumberOfPages();
            for (int i = 1; i <= pages; i++) {
                float x = pdf.getPage(i).getPageSize().getWidth() / 2;
                document.showTextAligned(new Paragraph(footer + "  ·  Página " + i + " de " + pages)
                                .setFontSize(8).setFontColor(MUTED),
                        x, 20, i, TextAlignment.CENTER, VerticalAlignment.BOTTOM, 0);
            }
            document.close();
            return out.toByteArray();
        } catch (Exception e) {
            throw new IllegalStateException("No se pudo generar el reporte PDF.", e);
        }
    }

    static void header(Document document, String company, String title, String filters, String user) {
        document.add(new Paragraph(company.toUpperCase() + " · INVENTARIO")
                .setFontSize(9).setFontColor(MUTED).setBold().setMarginBottom(0));
        document.add(new Paragraph(title).setFontSize(17).setBold().setFontColor(TEAL).setMarginTop(0).setMarginBottom(2));
        document.add(new Paragraph("Generado el " + LocalDateTime.now().format(DATE_TIME) + " por " + user)
                .setFontSize(9).setFontColor(MUTED).setMargin(0));
        document.add(new Paragraph(filters).setFontSize(9).setFontColor(MUTED).setMarginTop(0)
                .setMarginBottom(10).setBorderBottom(new SolidBorder(TEAL, 1.5f)).setPaddingBottom(6));
    }

    static void summary(Document document, String[][] values) {
        Table summary = new Table(UnitValue.createPercentArray(values.length)).useAllAvailableWidth().setMarginBottom(12);
        for (String[] item : values) {
            summary.addCell(new Cell().setBorder(Border.NO_BORDER).setBackgroundColor(ZEBRA).setPadding(6)
                    .add(new Paragraph(item[1]).setFontSize(14).setBold().setFontColor(TEAL).setMargin(0))
                    .add(new Paragraph(item[0]).setFontSize(8).setFontColor(MUTED).setMargin(0)));
        }
        document.add(summary);
    }

    static Table table(float[] widths, String... headers) {
        Table table = new Table(UnitValue.createPercentArray(widths)).useAllAvailableWidth();
        for (String header : headers) {
            table.addHeaderCell(new Cell().setBackgroundColor(TEAL).setBorder(Border.NO_BORDER).setPadding(5)
                    .add(new Paragraph(header).setBold().setFontSize(9).setFontColor(ColorConstants.WHITE)));
        }
        return table;
    }

    static Cell cell(Table table, String text, boolean zebra) {
        Cell cell = new Cell().setBorder(Border.NO_BORDER).setPadding(4).setFontSize(9)
                .add(new Paragraph(text == null || text.isBlank() ? "—" : text));
        if (zebra) {
            cell.setBackgroundColor(ZEBRA);
        }
        table.addCell(cell);
        return cell;
    }

    static void tableOrEmpty(Document document, Table table, boolean empty, String emptyMessage) {
        if (empty) {
            document.add(new Paragraph(emptyMessage).setFontSize(10).setFontColor(MUTED).setItalic());
        } else {
            document.add(table);
        }
    }
}
