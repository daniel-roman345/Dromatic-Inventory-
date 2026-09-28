package com.dromatic.inventory.map;

import jakarta.persistence.*;
import lombok.*;

/** Plano de un lugar físico: Bodega 1, Cuarto de etiquetas... */
@Entity
@Table(name = "map_areas")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class MapArea {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Código corto usado en las ubicaciones: B1, CE. */
    @Column(nullable = false, unique = true, length = 10)
    private String code;

    @Column(nullable = false, length = 60)
    private String name;

    @Column(length = 255)
    private String description;

    /** Tamaño de la cuadrícula en celdas. */
    @Column(name = "grid_width", nullable = false)
    private Integer gridWidth;

    @Column(name = "grid_height", nullable = false)
    private Integer gridHeight;

    @Column(name = "sort_order", nullable = false)
    @Builder.Default
    private Integer sortOrder = 0;

    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;
}
