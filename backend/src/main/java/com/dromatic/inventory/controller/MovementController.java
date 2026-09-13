package com.dromatic.inventory.controller;

import com.dromatic.inventory.dto.MovementRequest;
import com.dromatic.inventory.dto.MovementResponse;
import com.dromatic.inventory.dto.VoidMovementRequest;
import com.dromatic.inventory.model.MovementReasons;
import com.dromatic.inventory.model.MovementType;
import com.dromatic.inventory.service.MovementService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

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
        return ResponseEntity.ok(movementService.search(productId, startDate, endDate, type));
    }

    /** Motivos permitidos para entradas y salidas. */
    @GetMapping("/reasons")
    public ResponseEntity<Map<String, List<String>>> reasons() {
        return ResponseEntity.ok(Map.of(
                MovementType.ENTRADA.name(), MovementReasons.ENTRY,
                MovementType.SALIDA.name(), MovementReasons.EXIT));
    }

    @PostMapping("/entry")
    public ResponseEntity<List<MovementResponse>> registerEntry(@Valid @RequestBody MovementRequest request,
                                                                Authentication authentication) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(movementService.register(MovementType.ENTRADA, request, authentication.getName()));
    }

    @PostMapping("/exit")
    public ResponseEntity<List<MovementResponse>> registerExit(@Valid @RequestBody MovementRequest request,
                                                               Authentication authentication) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(movementService.register(MovementType.SALIDA, request, authentication.getName()));
    }

    @PostMapping("/{id}/void")
    public ResponseEntity<MovementResponse> voidMovement(@PathVariable Long id,
                                                         @Valid @RequestBody VoidMovementRequest request,
                                                         Authentication authentication) {
        return ResponseEntity.ok(movementService.voidMovement(id, request.getReason(), authentication.getName()));
    }
}
