package com.dromatic.inventory.alert;

import com.dromatic.inventory.item.Item;
import com.dromatic.inventory.user.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Alerta de stock bajo. Se abre sola cuando el total llega al mínimo y se cierra
 * sola cuando se repone. Mientras está abierta no se repite el correo.
 */
@Entity
@Table(name = "stock_alerts")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class StockAlert {

    public static final String ABIERTA = "ABIERTA";
    public static final String CERRADA = "CERRADA";

    public static final String EMAIL_PENDIENTE = "PENDIENTE";
    public static final String EMAIL_ENVIADO = "ENVIADO";
    public static final String EMAIL_ERROR = "ERROR";
    public static final String EMAIL_SIN_CONFIGURAR = "SIN_CONFIGURAR";
    public static final String EMAIL_SIN_DESTINATARIOS = "SIN_DESTINATARIOS";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "item_id", nullable = false)
    private Item item;

    @Column(nullable = false, length = 10)
    @Builder.Default
    private String status = ABIERTA;

    /** Total cuando se abrió la alerta. */
    @Column(nullable = false, precision = 14, scale = 3)
    private BigDecimal quantity;

    @Column(name = "minimum_stock", nullable = false, precision = 14, scale = 3)
    private BigDecimal minimumStock;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "closed_at")
    private LocalDateTime closedAt;

    @Column(name = "closed_reason", length = 120)
    private String closedReason;

    @Column(name = "email_status", nullable = false, length = 20)
    @Builder.Default
    private String emailStatus = EMAIL_PENDIENTE;

    @Column(name = "email_sent_at")
    private LocalDateTime emailSentAt;

    @Column(name = "email_error", length = 255)
    private String emailError;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ack_by")
    private User ackBy;

    @Column(name = "ack_at")
    private LocalDateTime ackAt;

    @Column(name = "ack_note", length = 255)
    private String ackNote;
}
