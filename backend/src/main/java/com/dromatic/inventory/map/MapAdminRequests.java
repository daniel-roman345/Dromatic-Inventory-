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
            @NotNull @Min(value = 3, message = "El mapa debe tener al menos 3 filas.") @Max(60) Integer gridHeight,
            @Size(max = 20) String levelLabel,
            Boolean levelsFromTop) {
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
            Boolean reversed,
            Boolean doubleSided,
            @Size(max = 255) String notes,
            @Min(0) @Max(value = 60, message = "Máximo 60 estanterías de una vez.") Integer rackCount,
            @Min(1) @Max(value = 20, message = "Máximo 20 pisos.") Integer rackLevels,
            @Min(1) @Max(value = 40, message = "El largo máximo es 40 celdas.") Integer rackLength,
            @Size(max = 10) String startCode) {
    }

    /**
     * Muro que rodea el cuarto por los bordes. Se salta lo que ya está ocupado
     * (escaleras, puertas, pasillos, otras estanterías) y las letras siguen en orden.
     */
    public record PerimeterRequest(
            Long moduleId,
            @Min(1) @Max(value = 20, message = "Máximo 20 pisos.") Integer levels,
            @Size(max = 10) String startCode,
            @Size(max = 40) String name,
            Boolean top,
            Boolean right,
            Boolean bottom,
            Boolean left) {
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
            @Min(value = 1, message = "El largo mínimo es 1 celda.") @Max(value = 40, message = "El largo máximo es 40 celdas.")
            Integer length,
            Long afterRackId,
            @Size(max = 255) String notes) {
    }

    public record LandmarkRequest(
            @NotBlank @Pattern(regexp = "PUERTA|OFICINA|ESCALERA|PASILLO|PARED|MAQUINA|MALACATE|OBSTACULO|TEXTO",
                    message = "Tipo de referencia no válido.") String kind,
            @Size(max = 60) String label,
            @NotNull @Min(0) Integer x,
            @NotNull @Min(0) Integer y,
            @NotNull @Min(1) Integer width,
            @NotNull @Min(1) Integer height) {
    }
}
