package com.dromatic.inventory.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "locations")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Location {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 30)
    private String zone;

    @Column(nullable = false, length = 30)
    private String aisle;

    @Column(nullable = false, length = 30)
    private String shelf;

    @Column(nullable = false, length = 30)
    private String level;

    public String getFullLabel() {
        return aisle + " - " + shelf + " - " + level;
    }
}
