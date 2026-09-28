package com.dromatic.inventory.movement;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface MovementRepository extends JpaRepository<Movement, Long> {

    @Query("SELECT m FROM Movement m JOIN FETCH m.item i JOIN FETCH i.module JOIN FETCH m.lot "
            + "LEFT JOIN FETCH m.fromRack LEFT JOIN FETCH m.toRack WHERE m.id = :id")
    Optional<Movement> findFull(@Param("id") Long id);
}
