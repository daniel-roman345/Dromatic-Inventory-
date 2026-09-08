package com.dromatic.inventory.repository;

import com.dromatic.inventory.model.Movement;
import com.dromatic.inventory.model.MovementType;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;

public interface MovementRepository extends JpaRepository<Movement, Long> {

    List<Movement> findByProductId(Long productId);

    List<Movement> findByType(MovementType type);

    List<Movement> findByMovementDateBetween(LocalDate start, LocalDate end);

    List<Movement> findByProductIdAndMovementDateBetween(Long productId, LocalDate start, LocalDate end);
}
