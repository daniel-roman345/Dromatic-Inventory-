package com.dromatic.inventory.item;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;

/**
 * Datos de un artículo. Solo el módulo y el nombre son obligatorios.
 *
 * @param unitName     unidad en que se cuenta; si se deja vacía se usa la del módulo
 * @param minimumStock cuando el total llegue a este valor se genera una alerta (0 o vacío = sin alerta)
 */
public record ItemRequest(
        @NotNull(message = "Escoja el módulo.") Long moduleId,
        @NotBlank(message = "Escriba el nombre del artículo.") @Size(max = 150) String name,
        @Size(max = 60) String presentation,
        @Size(max = 50) String code,
        @Size(max = 30) String unitName,
        @DecimalMin(value = "0", message = "El mínimo no puede ser negativo.")
        @DecimalMax(value = "99999999", message = "El mínimo es demasiado grande.") BigDecimal minimumStock,
        @Size(max = 500) String description) {
}
