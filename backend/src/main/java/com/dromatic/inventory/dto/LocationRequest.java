package com.dromatic.inventory.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class LocationRequest {

    @NotBlank(message = "La zona es obligatoria")
    @Size(max = 30, message = "La zona no puede superar 30 caracteres")
    private String zone;

    @NotBlank(message = "El pasillo es obligatorio")
    @Size(max = 30, message = "El pasillo no puede superar 30 caracteres")
    private String aisle;

    @NotBlank(message = "El estante es obligatorio")
    @Size(max = 30, message = "El estante no puede superar 30 caracteres")
    private String shelf;

    @NotBlank(message = "El nivel es obligatorio")
    @Size(max = 30, message = "El nivel no puede superar 30 caracteres")
    private String level;
}
