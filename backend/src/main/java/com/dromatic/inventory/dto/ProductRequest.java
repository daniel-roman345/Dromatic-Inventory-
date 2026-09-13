package com.dromatic.inventory.dto;

import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDate;

@Getter @Setter
public class ProductRequest {

    @NotBlank(message = "El código es obligatorio")
    @Size(max = 50, message = "El código no puede superar 50 caracteres")
    @Pattern(regexp = "^[A-Za-z0-9._-]+$", message = "El código solo puede tener letras, números, punto, guion y guion bajo (sin espacios)")
    private String code;

    @NotBlank(message = "El nombre es obligatorio")
    @Size(max = 150, message = "El nombre no puede superar 150 caracteres")
    private String name;

    @Size(max = 500, message = "La descripción no puede superar 500 caracteres")
    private String description;

    /** Cantidad inicial. Solo se usa al crear; después el stock cambia con entradas y salidas. */
    @Min(value = 0, message = "La cantidad no puede ser negativa")
    @Max(value = 1000000, message = "La cantidad es demasiado grande")
    private Integer quantity;

    @NotNull(message = "El stock mínimo es obligatorio")
    @Min(value = 0, message = "El stock mínimo no puede ser negativo")
    @Max(value = 1000000, message = "El stock mínimo es demasiado grande")
    private Integer minimumStock;

    @NotNull(message = "La ubicación es obligatoria")
    private Long locationId;

    @PastOrPresent(message = "La fecha de ingreso no puede ser futura")
    private LocalDate entryDate;

    @Pattern(regexp = "ACTIVO|INACTIVO", message = "Estado no válido")
    private String status;
}
