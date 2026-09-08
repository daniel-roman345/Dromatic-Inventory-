package com.dromatic.inventory.controller;

import com.dromatic.inventory.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/inventory")
    public ResponseEntity<byte[]> inventoryReport() {
        return pdfResponse(reportService.generateInventoryReport(), "reporte-inventario.pdf");
    }

    @GetMapping("/low-stock")
    public ResponseEntity<byte[]> lowStockReport() {
        return pdfResponse(reportService.generateLowStockReport(), "reporte-stock-bajo.pdf");
    }

    @GetMapping("/movements")
    public ResponseEntity<byte[]> movementsReport(
            @RequestParam(required = false) Long productId,
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate,
            @RequestParam(required = false) String type) {
        return pdfResponse(
                reportService.generateMovementsReport(productId, startDate, endDate, type),
                "reporte-movimientos.pdf");
    }

    private ResponseEntity<byte[]> pdfResponse(byte[] content, String filename) {
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + filename)
                .body(content);
    }
}
