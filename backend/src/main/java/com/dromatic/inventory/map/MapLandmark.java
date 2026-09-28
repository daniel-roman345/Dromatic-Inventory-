package com.dromatic.inventory.map;

import jakarta.persistence.*;
import lombok.*;

/** Referencia visual del mapa: puerta, oficina, escalera, pasillo, obstáculo o texto. */
@Entity
@Table(name = "map_landmarks")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class MapLandmark {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "area_id", nullable = false)
    private MapArea area;

    /** PUERTA, OFICINA, ESCALERA, PASILLO, OBSTACULO o TEXTO. */
    @Column(nullable = false, length = 20)
    private String kind;

    @Column(nullable = false, length = 60)
    private String label;

    @Column(name = "map_x", nullable = false)
    private Integer mapX;

    @Column(name = "map_y", nullable = false)
    private Integer mapY;

    @Column(nullable = false)
    @Builder.Default
    private Integer width = 1;

    @Column(nullable = false)
    @Builder.Default
    private Integer height = 1;
}
