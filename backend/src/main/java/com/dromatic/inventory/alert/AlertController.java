package com.dromatic.inventory.alert;

import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@Validated
@RequiredArgsConstructor
public class AlertController {

    private final AlertService alertService;

    public record AckRequest(@Size(max = 255) String note) {
    }

    /** @param status ABIERTA (por defecto), CERRADA o TODAS */
    @GetMapping("/api/alerts")
    public List<AlertResponse> list(@RequestParam(defaultValue = "ABIERTA") String status) {
        return alertService.list(status);
    }

    @GetMapping("/api/alerts/count")
    public Map<String, Long> count() {
        return Map.of("open", alertService.openCount());
    }

    @GetMapping("/api/alerts/config")
    public AlertService.ConfigResponse config() {
        return alertService.config();
    }

    @GetMapping("/api/alerts/{id}/whatsapp")
    public WhatsAppResponse whatsappForAlert(@PathVariable Long id) {
        return alertService.whatsappForAlert(id);
    }

    @PostMapping("/api/alerts/{id}/ack")
    public AlertResponse acknowledge(@PathVariable Long id, @RequestBody(required = false) AckRequest request) {
        return alertService.acknowledge(id, request == null ? null : request.note());
    }

    /** Aviso por WhatsApp sobre cualquier artículo, con la novedad escrita por el usuario. */
    @GetMapping("/api/items/{id}/whatsapp")
    public WhatsAppResponse whatsappForItem(@PathVariable Long id,
                                            @RequestParam(required = false) @Size(max = 80) String headline,
                                            @RequestParam(required = false) @Size(max = 300) String note) {
        return alertService.whatsappForItem(id, headline, note);
    }

    @PostMapping("/api/admin/alerts/{id}/resend")
    public AlertMailer.Result resend(@PathVariable Long id) {
        return alertService.resendEmail(id);
    }

    @PostMapping("/api/admin/alerts/test-email")
    public AlertMailer.Result testEmail() {
        return alertService.testEmail();
    }
}
