package com.dromatic.inventory.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class LocationRequest {

    @NotBlank(message = "La zona es obligatoria")
    private String zone;

    @NotBlank(message = "El pasillo es obligatorio")
    private String aisle;

    @NotBlank(message = "El estante es obligatorio")
    private String shelf;

    @NotBlank(message = "El nivel es obligatorio")
    private String level;
}
