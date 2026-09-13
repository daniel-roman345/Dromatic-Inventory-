package com.dromatic.inventory.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class VoidMovementRequest {

    @NotBlank(message = "Indique el motivo de la anulación")
    @Size(max = 255, message = "El motivo no puede superar 255 caracteres")
    private String reason;
}
