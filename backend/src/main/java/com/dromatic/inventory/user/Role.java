package com.dromatic.inventory.user;

import jakarta.persistence.*;
import lombok.*;

/** Rol del usuario. Los permisos por módulo se definen en {@code module_editor_roles}. */
@Entity
@Table(name = "roles")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Role {

    public static final String ADMIN = "ADMIN";
    public static final String JEFE = "JEFE";
    public static final String BODEGA = "BODEGA";
    public static final String PRODUCCION = "PRODUCCION";
    public static final String CONSULTA = "CONSULTA";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 30)
    private String code;

    @Column(nullable = false, length = 60)
    private String name;

    @Column(length = 255)
    private String description;
}
