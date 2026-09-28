package com.dromatic.inventory.map;

import com.dromatic.inventory.module.InventoryModule;
import jakarta.persistence.*;
import lombok.*;

/** Grupo de estanterías dentro de un área: un pasillo, un muro o una zona. */
@Entity
@Table(name = "map_sections")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class MapSection {

    public static final String PASILLO = "PASILLO";
    public static final String MURO = "MURO";
    public static final String ZONA = "ZONA";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "area_id", nullable = false)
    private MapArea area;

    /** Código corto: P4, MS, Z1I. */
    @Column(nullable = false, length = 20)
    private String code;

    @Column(nullable = false, length = 60)
    private String name;

    /** PASILLO, MURO o ZONA. */
    @Column(nullable = false, length = 20)
    private String kind;

    /** Módulo que se guarda principalmente aquí (define el color en el mapa). */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "module_id")
    private InventoryModule module;

    @Column(name = "map_x", nullable = false)
    private Integer mapX;

    @Column(name = "map_y", nullable = false)
    private Integer mapY;

    /** H: estanterías en fila (de izquierda a derecha). V: en columna (de arriba abajo). */
    @Column(nullable = false, columnDefinition = "CHAR(1)")
    @Builder.Default
    private String orientation = "H";

    /** Estantería doble: se puede sacar mercancía por ambos lados. */
    @Column(name = "double_sided", nullable = false)
    @Builder.Default
    private Boolean doubleSided = false;

    @Column(length = 255)
    private String notes;

    @Column(name = "sort_order", nullable = false)
    @Builder.Default
    private Integer sortOrder = 0;
}
