package com.dromatic.inventory.suggestion;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** @param moduleId NULL para que aplique a todos los módulos */
public record SuggestionRequest(
        @NotNull(message = "Escoja qué campo tendrá la sugerencia.") SuggestionKind kind,
        Long moduleId,
        @NotBlank(message = "Escriba el texto de la sugerencia.") @Size(max = 80) String value) {
}
