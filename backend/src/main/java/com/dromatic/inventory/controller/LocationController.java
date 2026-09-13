package com.dromatic.inventory.controller;

import com.dromatic.inventory.dto.LocationRequest;
import com.dromatic.inventory.dto.LocationResponse;
import com.dromatic.inventory.dto.MessageResponse;
import com.dromatic.inventory.service.LocationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/locations")
@RequiredArgsConstructor
public class LocationController {

    private final LocationService locationService;

    @GetMapping
    public ResponseEntity<List<LocationResponse>> findAll() {
        return ResponseEntity.ok(locationService.findAll());
    }

    @PostMapping
    public ResponseEntity<LocationResponse> create(@Valid @RequestBody LocationRequest request) {
        return ResponseEntity.ok(locationService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<LocationResponse> update(@PathVariable Long id, @Valid @RequestBody LocationRequest request) {
        return ResponseEntity.ok(locationService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<MessageResponse> delete(@PathVariable Long id) {
        locationService.delete(id);
        return ResponseEntity.ok(new MessageResponse("Ubicación eliminada correctamente."));
    }
}
