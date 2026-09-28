package com.dromatic.inventory.module;

import com.dromatic.inventory.user.Role;
import jakarta.persistence.*;
import lombok.*;

import java.util.HashSet;
import java.util.Set;

/**
 * Módulo de inventario: potes, tapas, etiquetas, materias primas, bobinas, cajas de sachets...
 * Agregar un módulo nuevo es insertar una fila (con su unidad y quién lo edita), sin programar.
 */
@Entity
@Table(name = "inventory_modules")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class InventoryModule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 30)
    private String code;

    @Column(nullable = false, length = 60)
    private String name;

    @Column(length = 255)
    private String description;

    /** Unidad propuesta al crear un artículo; cada artículo puede usar otra. */
    @Column(name = "default_unit", nullable = false, length = 30)
    private String defaultUnit;

    /** Tipo de material propuesto al llenar el rótulo. */
    @Column(name = "default_material", length = 60)
    private String defaultMaterial;

    /** El formulario de entrada muestra el peso desde el inicio (bobinas). */
    @Column(name = "tracks_weight", nullable = false)
    private Boolean tracksWeight;

    /** Ubicación sugerida para módulos sin mapa. */
    @Column(name = "location_hint", length = 120)
    private String locationHint;

    @Column(nullable = false, length = 20)
    private String color;

    @Column(nullable = false, length = 40)
    private String icon;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder;

    @Column(nullable = false)
    private Boolean active;

    /** Roles que pueden modificar este módulo (además del administrador). */
    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(name = "module_editor_roles",
            joinColumns = @JoinColumn(name = "module_id"),
            inverseJoinColumns = @JoinColumn(name = "role_id"))
    @Builder.Default
    private Set<Role> editorRoles = new HashSet<>();
}
