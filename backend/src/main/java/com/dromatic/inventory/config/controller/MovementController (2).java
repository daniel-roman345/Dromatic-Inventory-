package com.dromatic.inventory.controller;

import com.dromatic.inventory.dto.MovementRequest;
import com.dromatic.inventory.dto.MovementResponse;
import com.dromatic.inventory.model.MovementType;
import com.dromatic.inventory.service.MovementService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/movements")
@RequiredArgsConstructor
public class MovementController {

    private final MovementService movementService;

    @GetMapping
    public ResponseEntity<List<MovementResponse>> findAll(
            @RequestParam(required = false) Long productId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) MovementType type) {
        return ResponseEntity.ok(movementService.findByFilters(productId, startDate, endDate, type));
    }

    @PostMapping("/entry")
    public ResponseEntity<MovementResponse> registerEntry(@Valid @RequestBody MovementRequest request,
                                                            Authentication authentication) {
        return ResponseEntity.ok(movementService.registerEntry(request, authentication.getName()));
    }

    @PostMapping("/exit")
    public ResponseEntity<MovementResponse> registerExit(@Valid @RequestBody MovementRequest request,
                                                           Authentication authentication) {
        return ResponseEntity.ok(movementService.registerExit(request, authentication.getName()));
    }
}
