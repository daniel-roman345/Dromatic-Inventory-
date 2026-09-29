package com.dromatic.inventory.map;

import jakarta.persistence.*;
import lombok.*;

/**
 * Estantería de una sección. La letra identifica la estantería y el número el
 * piso: en el pasillo 4, la estantería C tiene los pisos C1, C2 y C3.
 */
@Entity
@Table(name = "racks")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Rack {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "section_id", nullable = false)
    private MapSection section;

    /** Letra de la estantería: A, B, C... */
    @Column(nullable = false, length = 10)
    private String code;

    /** Cantidad de pisos (o filas). */
    @Column(nullable = false)
    private Integer levels;

    /** Largo en celdas del mapa: una estantería larga sin divisiones ocupa varias. */
    @Column(nullable = false)
    @Builder.Default
    private Integer length = 1;

    /** Orden dentro de la sección. */
    @Column(nullable = false)
    @Builder.Default
    private Integer position = 0;

    @Column(length = 255)
    private String notes;

    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;

    /** Nombre del piso tal como se dice en la bodega: "C2". */
    public String levelLabel(int level) {
        return code + level;
    }

    /** Código completo de la ubicación: "B1-P4-C2". */
    public String locationCode(int level) {
        return section.getArea().getCode() + "-" + section.getCode() + "-" + levelLabel(level);
    }

    /** Descripción legible: "Bodega 1 · Pasillo 4 · C2". */
    public String locationName(int level) {
        return section.getArea().getName() + " · " + section.getName() + " · " + levelLabel(level);
    }
}
