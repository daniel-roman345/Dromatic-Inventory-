package com.dromatic.inventory.report;

import com.dromatic.inventory.movement.MovementEffect;
import com.dromatic.inventory.movement.MovementQueryService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.Locale;

/** Descarga de reportes. {@code format}: pdf (para imprimir) o csv (para Excel). */
@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/inventory")
    public ResponseEntity<byte[]> inventory(@RequestParam(required = false) String module,
                                            @RequestParam(defaultValue = "false") boolean lowStock,
                                            @RequestParam(defaultValue = "pdf") String format) {
        String base = (lowStock ? "stock-bajo" : "inventario") + "-" + slug(module);
        return isCsv(format)
                ? file(reportService.inventoryCsv(module, lowStock), base, true)
                : file(reportService.inventoryPdf(module, lowStock), base, false);
    }

    @GetMapping("/movements")
    public ResponseEntity<byte[]> movements(
            @RequestParam(required = false) String module,
            @RequestParam(required = false) Long itemId,
            @RequestParam(required = false) MovementEffect effect,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(defaultValue = "true") boolean includeVoided,
            @RequestParam(defaultValue = "pdf") String format) {
        var filter = new MovementQueryService.Filter(module, itemId, null, effect, from, to, null, includeVoided);
        String base = "movimientos-" + slug(module);
        return isCsv(format)
                ? file(reportService.movementsCsv(filter), base, true)
                : file(reportService.movementsPdf(filter), base, false);
    }

    private static ResponseEntity<byte[]> file(byte[] content, String base, boolean csv) {
        String filename = base + "-" + LocalDate.now() + (csv ? ".csv" : ".pdf");
        return ResponseEntity.ok()
                .contentType(csv ? new MediaType("text", "csv", StandardCharsets.UTF_8) : MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment().filename(filename, StandardCharsets.UTF_8).build().toString())
                .body(content);
    }

    private static boolean isCsv(String format) {
        return "csv".equalsIgnoreCase(format);
    }

    private static String slug(String module) {
        return module == null || module.isBlank() ? "general" : module.toLowerCase(Locale.ROOT).replace('_', '-');
    }
}
