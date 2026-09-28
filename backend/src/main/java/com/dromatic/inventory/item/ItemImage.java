package com.dromatic.inventory.item;

import com.dromatic.inventory.user.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/** Imagen delantera (FRONT) o trasera (BACK) de un artículo. */
@Entity
@Table(name = "item_images")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ItemImage {

    public static final String FRONT = "FRONT";
    public static final String BACK = "BACK";
    public static final String SOURCE_UPLOAD = "SUBIDA";
    public static final String SOURCE_VIDEO = "VIDEO";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "item_id", nullable = false)
    private Item item;

    @Column(nullable = false, length = 10)
    private String side;

    @Column(name = "content_type", nullable = false, length = 50)
    private String contentType;

    @Column(nullable = false, columnDefinition = "MEDIUMBLOB")
    private byte[] data;

    @Column(name = "size_bytes", nullable = false)
    private Integer sizeBytes;

    /** SUBIDA por un usuario o VIDEO (recorte provisional de los videos de la bodega). */
    @Column(nullable = false, length = 20)
    private String source;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "updated_by")
    private User updatedBy;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
