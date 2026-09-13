package com.dromatic.inventory.controller;

import com.dromatic.inventory.model.MovementType;
import com.dromatic.inventory.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/inventory")
    public ResponseEntity<byte[]> inventoryReport(Authentication authentication) {
        return pdf(reportService.generateInventoryReport(authentication.getName()), "reporte-inventario.pdf");
    }

    @GetMapping("/low-stock")
    public ResponseEntity<byte[]> lowStockReport(Authentication authentication) {
        return pdf(reportService.generateLowStockReport(authentication.getName()), "reporte-stock-bajo.pdf");
    }

    @GetMapping("/movements")
    public ResponseEntity<byte[]> movementsReport(
            @RequestParam(required = false) Long productId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) MovementType type,
            Authentication authentication) {
        return pdf(reportService.generateMovementsReport(productId, startDate, endDate, type, authentication.getName()),
                "reporte-movimientos.pdf");
    }

    private ResponseEntity<byte[]> pdf(byte[] content, String filename) {
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .body(content);
    }
}
