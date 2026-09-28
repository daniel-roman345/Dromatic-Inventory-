package com.dromatic.inventory.lot;

import com.dromatic.inventory.item.Item;
import com.dromatic.inventory.user.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Rótulo de identificación de Laboratorios Dromatic: cada canasta, rollo, caja
 * o granel que llega trae uno. El inventario se controla por rótulo.
 * Obligatorios: artículo, fecha y tipo de material; quien lo registra se toma
 * de la sesión. Todo lo demás se copia del rótulo físico si está escrito.
 */
@Entity
@Table(name = "lots")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Lot {

    public static final String CUARENTENA = "CUARENTENA";
    public static final String APROBADO = "APROBADO";
    public static final String RECHAZADO = "RECHAZADO";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "item_id", nullable = false)
    private Item item;

    @Column(name = "label_date", nullable = false)
    private LocalDate labelDate;

    @Column(name = "material_type", nullable = false, length = 60)
    private String materialType;

    @Column(name = "lot_number", length = 50)
    private String lotNumber;

    /** CANTIDAD tal como está escrita en el rótulo ("X1000", "2 rollos"...). */
    @Column(name = "declared_quantity", length = 40)
    private String declaredQuantity;

    @Column(length = 120)
    private String supplier;

    @Column(name = "reception_date")
    private LocalDate receptionDate;

    @Column(name = "analysis_date")
    private LocalDate analysisDate;

    @Column(name = "reanalysis_date")
    private LocalDate reanalysisDate;

    @Column(name = "expiry_date")
    private LocalDate expiryDate;

    @Column(name = "analysis_number", length = 40)
    private String analysisNumber;

    @Column(name = "reanalysis_number", length = 40)
    private String reanalysisNumber;

    /** CUARENTENA (amarillo), APROBADO (verde) o RECHAZADO (rojo). */
    @Column(name = "quality_status", length = 12)
    private String qualityStatus;

    @Column(length = 80)
    private String responsible;

    @Column(name = "qc_signature", length = 80)
    private String qcSignature;

    /** Rombo NFPA 704: 0 a 4. */
    @Column(name = "nfpa_health")
    private Byte nfpaHealth;

    @Column(name = "nfpa_flammability")
    private Byte nfpaFlammability;

    @Column(name = "nfpa_reactivity")
    private Byte nfpaReactivity;

    @Column(name = "nfpa_special", length = 10)
    private String nfpaSpecial;

    @Column(length = 500)
    private String notes;

    /** FALSE si se cargó desde los videos y falta confirmarlo en la bodega. */
    @Column(nullable = false)
    @Builder.Default
    private Boolean verified = true;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "updated_by")
    private User updatedBy;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
