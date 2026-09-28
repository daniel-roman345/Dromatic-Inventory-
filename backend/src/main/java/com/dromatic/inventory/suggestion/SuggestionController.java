package com.dromatic.inventory.suggestion;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class SuggestionController {

    private final SuggestionService suggestionService;

    /** Todas las listas de autocompletar de un módulo en una sola llamada. */
    @GetMapping("/api/suggestions")
    public Map<SuggestionKind, List<String>> forModule(@RequestParam(required = false) Long moduleId) {
        return suggestionService.forModule(moduleId);
    }

    @GetMapping("/api/admin/suggestions")
    public List<SuggestionResponse> findAllForAdmin() {
        return suggestionService.findAllForAdmin();
    }

    @PostMapping("/api/admin/suggestions")
    @ResponseStatus(HttpStatus.CREATED)
    public SuggestionResponse create(@Valid @RequestBody SuggestionRequest request) {
        return suggestionService.create(request);
    }

    @DeleteMapping("/api/admin/suggestions/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        suggestionService.delete(id);
    }
}
