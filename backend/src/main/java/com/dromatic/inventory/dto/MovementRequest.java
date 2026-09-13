package com.dromatic.inventory.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDate;
import java.util.List;

/** Registro de una entrada o salida que puede incluir varios productos. */
@Getter @Setter
public class MovementRequest {

    @NotEmpty(message = "Agregue al menos un producto")
    @Size(max = 200, message = "Máximo 200 productos por registro")
    @Valid
    private List<MovementItemRequest> items;

    @PastOrPresent(message = "La fecha no puede ser futura")
    private LocalDate movementDate;

    @NotBlank(message = "El motivo es obligatorio")
    private String reason;

    @Size(max = 50, message = "El documento no puede superar 50 caracteres")
    private String reference;

    @Size(max = 500, message = "La observación no puede superar 500 caracteres")
    private String observation;
}
