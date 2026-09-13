package com.dromatic.inventory.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "movements")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Movement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, length = 10)
    private MovementType type;

    @Column(nullable = false)
    private Integer quantity;

    @Column(name = "movement_date", nullable = false)
    private LocalDate movementDate;

    @Column(length = 255)
    private String reason;

    /** Número de remisión, factura u orden asociado (opcional). */
    @Column(length = 50)
    private String reference;

    @Column(length = 500)
    private String observation;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    @Builder.Default
    private Boolean voided = false;

    @Column(name = "voided_at")
    private LocalDateTime voidedAt;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "voided_by")
    private User voidedBy;

    @Column(name = "void_reason", length = 255)
    private String voidReason;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
