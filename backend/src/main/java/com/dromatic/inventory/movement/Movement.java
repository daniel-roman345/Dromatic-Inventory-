package com.dromatic.inventory.movement;

import com.dromatic.inventory.item.Item;
import com.dromatic.inventory.lot.Lot;
import com.dromatic.inventory.map.Rack;
import com.dromatic.inventory.user.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/** Registro del historial. Nunca se borra: si hubo un error, el administrador lo anula. */
@Entity
@Table(name = "movements")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Movement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, length = 10)
    private MovementEffect effect;

    /** Nombre escrito por el usuario: "Entrada", "Préstamo", "Despacho a maquila"... */
    @Column(name = "movement_type", nullable = false, length = 60)
    private String movementType;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "item_id", nullable = false)
    private Item item;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "lot_id", nullable = false)
    private Lot lot;

    /** Cantidad movida, siempre positiva. */
    @Column(nullable = false, precision = 14, scale = 3)
    private BigDecimal quantity;

    /** Efecto en el total: positivo entra, negativo sale, cero traslado. */
    @Column(name = "stock_delta", nullable = false, precision = 14, scale = 3)
    private BigDecimal stockDelta;

    @Column(name = "unit_name", nullable = false, length = 30)
    private String unitName;

    @Column(precision = 14, scale = 3)
    private BigDecimal containers;

    @Column(name = "container_name", length = 40)
    private String containerName;

    @Column(name = "units_per_container", precision = 14, scale = 3)
    private BigDecimal unitsPerContainer;

    @Column(name = "weight_kg", precision = 14, scale = 3)
    private BigDecimal weightKg;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "from_rack_id")
    private Rack fromRack;

    @Column(name = "from_level")
    private Integer fromLevel;

    @Column(name = "from_note", length = 120)
    private String fromNote;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "to_rack_id")
    private Rack toRack;

    @Column(name = "to_level")
    private Integer toLevel;

    @Column(name = "to_note", length = 120)
    private String toNote;

    @Column(length = 120)
    private String reason;

    @Column(length = 500)
    private String note;

    /** Remisión, factura u orden de producción. */
    @Column(length = 60)
    private String reference;

    @Column(name = "movement_date", nullable = false)
    private LocalDate movementDate;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    @Builder.Default
    private Boolean voided = false;

    @Column(name = "voided_at")
    private LocalDateTime voidedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "voided_by")
    private User voidedBy;

    @Column(name = "void_reason", length = 255)
    private String voidReason;
}
