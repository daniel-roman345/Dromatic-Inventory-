package com.dromatic.inventory.movement;

import com.dromatic.inventory.common.web.PageResponse;
import com.dromatic.inventory.movement.MovementRequests.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

/**
 * Entradas, salidas, traslados y ajustes. El permiso se revisa por módulo en el
 * servicio; anular es solo para el administrador (ver SecurityConfig).
 */
@RestController
@RequestMapping("/api/movements")
@RequiredArgsConstructor
public class MovementController {

    private final MovementService movementService;
    private final MovementQueryService queryService;

    @GetMapping
    public PageResponse<MovementResponse> search(
            @RequestParam(required = false) String module,
            @RequestParam(required = false) Long itemId,
            @RequestParam(required = false) Long lotId,
            @RequestParam(required = false) MovementEffect effect,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "true") boolean includeVoided,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "30") int size) {
        return queryService.search(new MovementQueryService.Filter(module, itemId, lotId, effect, from, to, q,
                includeVoided), page, size);
    }

    @GetMapping("/{id}")
    public MovementResponse get(@PathVariable Long id) {
        return queryService.get(id);
    }

    @PostMapping("/entry")
    @ResponseStatus(HttpStatus.CREATED)
    public MovementResponse entry(@Valid @RequestBody EntryRequest request) {
        return queryService.get(movementService.entry(request));
    }

    @PostMapping("/exit")
    @ResponseStatus(HttpStatus.CREATED)
    public List<MovementResponse> exit(@Valid @RequestBody ExitRequest request) {
        return queryService.get(movementService.exit(request));
    }

    @PostMapping("/transfer")
    @ResponseStatus(HttpStatus.CREATED)
    public MovementResponse transfer(@Valid @RequestBody TransferRequest request) {
        return queryService.get(movementService.transfer(request));
    }

    @PostMapping("/adjust")
    @ResponseStatus(HttpStatus.CREATED)
    public MovementResponse adjust(@Valid @RequestBody AdjustRequest request) {
        return queryService.get(movementService.adjust(request));
    }

    @PostMapping("/{id}/void")
    public MovementResponse voidMovement(@PathVariable Long id, @Valid @RequestBody VoidRequest request) {
        return queryService.get(movementService.voidMovement(id, request));
    }
}
