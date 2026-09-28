package com.dromatic.inventory.lot;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
public class LotController {

    private final LotService lotService;

    @GetMapping("/api/lots/{id}")
    public LotResponse get(@PathVariable Long id) {
        return lotService.get(id);
    }

    @PutMapping("/api/lots/{id}")
    public LotResponse update(@PathVariable Long id, @Valid @RequestBody LabelRequest request) {
        return lotService.update(id, request);
    }

    @PostMapping("/api/lots/{id}/verify")
    public LotResponse verify(@PathVariable Long id) {
        return lotService.verify(id);
    }

    /** Lo que hay en un piso de una estantería. */
    @GetMapping("/api/locations/{rackId}/levels/{level}")
    public LocationContentResponse contentAt(@PathVariable Long rackId, @PathVariable int level) {
        return lotService.contentAt(rackId, level);
    }
}
