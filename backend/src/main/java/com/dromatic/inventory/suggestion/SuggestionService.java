package com.dromatic.inventory.suggestion;

import com.dromatic.inventory.common.exception.BusinessException;
import com.dromatic.inventory.common.exception.DuplicateResourceException;
import com.dromatic.inventory.common.exception.ResourceNotFoundException;
import com.dromatic.inventory.module.ModuleService;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

/**
 * Autocompletar de los campos libres: primero lo que más se ha usado en el
 * historial, luego los valores base. Nada de esto obliga: son solo ayudas.
 */
@Service
@RequiredArgsConstructor
public class SuggestionService {

    private final SuggestionRepository suggestionRepository;
    private final NamedParameterJdbcTemplate jdbc;
    private final ModuleService moduleService;

    @Transactional(readOnly = true)
    public Map<SuggestionKind, List<String>> forModule(Long moduleId) {
        Map<SuggestionKind, List<String>> base = new EnumMap<>(SuggestionKind.class);
        for (Suggestion s : suggestionRepository.findActive(moduleId)) {
            base.computeIfAbsent(s.getKind(), k -> new ArrayList<>()).add(s.getValue());
        }
        var params = new MapSqlParameterSource("moduleId", moduleId);
        Map<SuggestionKind, List<String>> result = new EnumMap<>(SuggestionKind.class);
        for (SuggestionKind kind : SuggestionKind.values()) {
            // La clave en minúsculas evita repetir "Canasta" y "canasta".
            Map<String, String> merged = new LinkedHashMap<>();
            for (String used : jdbc.queryForList(kind.historySql(), params, String.class)) {
                if (used != null && !used.isBlank()) {
                    merged.putIfAbsent(used.trim().toLowerCase(Locale.ROOT), used.trim());
                }
            }
            for (String value : base.getOrDefault(kind, List.of())) {
                merged.putIfAbsent(value.toLowerCase(Locale.ROOT), value);
            }
            result.put(kind, List.copyOf(merged.values()));
        }
        return result;
    }

    @Transactional(readOnly = true)
    public List<SuggestionResponse> findAllForAdmin() {
        return suggestionRepository.findAllForAdmin().stream().map(SuggestionResponse::from).toList();
    }

    @Transactional
    public SuggestionResponse create(SuggestionRequest request) {
        if (!request.kind().isEditable()) {
            throw new BusinessException("Este campo se sugiere solo con lo que ya se ha escrito antes.");
        }
        String value = request.value().trim();
        boolean exists = suggestionRepository.findActive(request.moduleId()).stream()
                .anyMatch(s -> s.getKind() == request.kind() && s.getValue().equalsIgnoreCase(value)
                        && Objects.equals(s.getModule() == null ? null : s.getModule().getId(), request.moduleId()));
        if (exists) {
            throw new DuplicateResourceException("Esa sugerencia ya existe.");
        }
        Suggestion suggestion = Suggestion.builder()
                .kind(request.kind())
                .module(request.moduleId() == null ? null : moduleService.getById(request.moduleId()))
                .value(value)
                .sortOrder(99)
                .build();
        return SuggestionResponse.from(suggestionRepository.save(suggestion));
    }

    @Transactional
    public void delete(Long id) {
        Suggestion suggestion = suggestionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("La sugerencia no existe."));
        suggestionRepository.delete(suggestion);
    }
}
