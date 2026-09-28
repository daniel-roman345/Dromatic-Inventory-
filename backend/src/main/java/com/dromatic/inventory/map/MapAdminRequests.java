package com.dromatic.inventory.map;

import jakarta.validation.constraints.*;

/** Formularios del editor de mapas (solo administrador). */
public final class MapAdminRequests {

    private MapAdminRequests() {
    }

    public record AreaRequest(
            @NotBlank(message = "Escriba el código del mapa.") @Size(max = 10)
            @Pattern(regexp = "^[A-Za-z0-9]+$", message = "El código solo puede tener letras y números.") String code,
            @NotBlank(message = "Escriba el nombre del mapa.") @Size(max = 60) String name,
            @Size(max = 255) String description,
            @NotNull @Min(value = 3, message = "El mapa debe tener al menos 3 columnas.") @Max(60) Integer gridWidth,
            @NotNull @Min(value = 3, message = "El mapa debe tener al menos 3 filas.") @Max(60) Integer gridHeight) {
    }

    public record SectionRequest(
            @NotBlank(message = "Escriba el código de la sección (ej. P8).") @Size(max = 20)
            @Pattern(regexp = "^[A-Za-z0-9]+$", message = "El código solo puede tener letras y números.") String code,
            @NotBlank(message = "Escriba el nombre de la sección.") @Size(max = 60) String name,
            @NotBlank @Pattern(regexp = "PASILLO|MURO|ZONA", message = "El tipo debe ser pasillo, muro o zona.") String kind,
            Long moduleId,
            @NotNull @Min(0) Integer x,
            @NotNull @Min(0) Integer y,
            @Pattern(regexp = "H|V", message = "La orientación debe ser H (en fila) o V (en columna).") String orientation,
            Boolean doubleSided,
            @Size(max = 255) String notes) {
    }

    /**
     * @param afterRackId al crear: ubicarla justo después de esta estantería (NULL = al final).
     *                    Las siguientes se corren un puesto sin cambiar de letra.
     */
    public record RackRequest(
            @NotBlank(message = "Escriba la letra de la estantería.") @Size(max = 10)
            @Pattern(regexp = "^[A-Za-z0-9]+$", message = "La estantería se identifica con letras o números.") String code,
            @NotNull @Min(value = 1, message = "La estantería debe tener al menos 1 piso.")
            @Max(value = 20, message = "La estantería puede tener máximo 20 pisos.") Integer levels,
            Long afterRackId,
            @Size(max = 255) String notes) {
    }

    public record LandmarkRequest(
            @NotBlank @Pattern(regexp = "PUERTA|OFICINA|ESCALERA|PASILLO|OBSTACULO|TEXTO",
                    message = "Tipo de referencia no válido.") String kind,
            @NotBlank(message = "Escriba el texto de la referencia.") @Size(max = 60) String label,
            @NotNull @Min(0) Integer x,
            @NotNull @Min(0) Integer y,
            @NotNull @Min(1) Integer width,
            @NotNull @Min(1) Integer height) {
    }
}
