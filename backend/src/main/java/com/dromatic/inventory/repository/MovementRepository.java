package com.dromatic.inventory.repository;

import com.dromatic.inventory.model.Movement;
import com.dromatic.inventory.model.MovementType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDate;
import java.util.List;

public interface MovementRepository extends JpaRepository<Movement, Long> {

    @Query("SELECT m FROM Movement m JOIN FETCH m.product p JOIN FETCH m.user LEFT JOIN FETCH m.voidedBy " +
           "WHERE (:productId IS NULL OR p.id = :productId) " +
           "AND (:type IS NULL OR m.type = :type) " +
           "AND (:start IS NULL OR m.movementDate >= :start) " +
           "AND (:end IS NULL OR m.movementDate <= :end) " +
           "ORDER BY m.movementDate DESC, m.createdAt DESC, m.id DESC")
    List<Movement> search(@Param("productId") Long productId,
                          @Param("type") MovementType type,
                          @Param("start") LocalDate start,
                          @Param("end") LocalDate end);

    List<Movement> findTop8ByOrderByCreatedAtDescIdDesc();

    boolean existsByProductId(Long productId);

    @Query("SELECT COALESCE(SUM(m.quantity), 0) FROM Movement m " +
           "WHERE m.type = :type AND m.voided = false AND m.movementDate BETWEEN :start AND :end")
    Long sumQuantity(@Param("type") MovementType type,
                     @Param("start") LocalDate start,
                     @Param("end") LocalDate end);
}
