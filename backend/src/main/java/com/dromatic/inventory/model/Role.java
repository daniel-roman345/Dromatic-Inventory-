package com.dromatic.inventory.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "roles")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Role {

    public static final String ADMINISTRADOR = "ADMINISTRADOR";
    public static final String OPERADOR = "OPERADOR";
    public static final String CONSULTA = "CONSULTA";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 30)
    private String name;
}
