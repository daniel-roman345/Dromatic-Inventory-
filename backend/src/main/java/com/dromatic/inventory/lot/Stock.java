package com.dromatic.inventory.lot;

import com.dromatic.inventory.map.Rack;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;

/**
 * Cuánto hay de un rótulo en una ubicación. La ubicación es una estantería y un
 * piso del mapa, o una nota escrita cuando el módulo no tiene mapa.
 * Un rótulo puede quedar repartido en varias ubicaciones después de un traslado.
 */
@Entity
@Table(name = "stock")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Stock {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "lot_id", nullable = false)
    private Lot lot;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rack_id")
    private Rack rack;

    private Integer level;

    @Column(name = "location_note", length = 120)
    private String locationNote;

    @Column(nullable = false, precision = 14, scale = 3)
    @Builder.Default
    private BigDecimal quantity = BigDecimal.ZERO;

    @Column(name = "weight_kg", precision = 14, scale = 3)
    private BigDecimal weightKg;

    @Column(name = "container_name", length = 40)
    private String containerName;

    @Column(name = "units_per_container", precision = 14, scale = 3)
    private BigDecimal unitsPerContainer;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    /** Contenedores aproximados (ej. 2,8 canastas) o NULL si no se sabe. */
    public BigDecimal approxContainers() {
        if (unitsPerContainer == null || unitsPerContainer.signum() <= 0) {
            return null;
        }
        return quantity.divide(unitsPerContainer, 1, RoundingMode.HALF_UP);
    }
}
