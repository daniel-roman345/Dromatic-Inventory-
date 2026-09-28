package com.dromatic.inventory.item;

import com.dromatic.inventory.module.InventoryModule;
import com.dromatic.inventory.user.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Artículo del catálogo: un pote, una tapa, una etiqueta, una materia prima...
 * La cantidad total es la suma de sus rótulos (ver {@code lot.Stock}).
 */
@Entity
@Table(name = "items")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Item {

    public static final String ACTIVO = "ACTIVO";
    public static final String INACTIVO = "INACTIVO";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "module_id", nullable = false)
    private InventoryModule module;

    /** Código interno o SKU (opcional). */
    @Column(length = 50)
    private String code;

    @Column(nullable = false, length = 150)
    private String name;

    /** Ej.: x250 ml, delantera, trasera. */
    @Column(length = 60)
    private String presentation;

    @Column(length = 500)
    private String description;

    /** Unidad en que se cuenta: unidades, kg, bobinas, metros... */
    @Column(name = "unit_name", nullable = false, length = 30)
    private String unitName;

    /** Alerta cuando el total llega a este valor. 0 = sin alerta. */
    @Column(name = "minimum_stock", nullable = false, precision = 14, scale = 3)
    @Builder.Default
    private BigDecimal minimumStock = BigDecimal.ZERO;

    /** Se propone en la siguiente entrada: "igual que la última vez". */
    @Column(name = "last_container_name", length = 40)
    private String lastContainerName;

    @Column(name = "last_units_per_container", precision = 14, scale = 3)
    private BigDecimal lastUnitsPerContainer;

    @Column(nullable = false, length = 10)
    @Builder.Default
    private String status = ACTIVO;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    /** "Pote x250 ml" o solo el nombre si no tiene presentación. */
    public String displayName() {
        return presentation == null || presentation.isBlank() ? name : name + " " + presentation;
    }
}
