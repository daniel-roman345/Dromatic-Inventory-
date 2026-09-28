package com.dromatic.inventory.alert;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface StockAlertRepository extends JpaRepository<StockAlert, Long> {

    Optional<StockAlert> findFirstByItemIdAndStatus(Long itemId, String status);

    @Query("SELECT a FROM StockAlert a JOIN FETCH a.item i JOIN FETCH i.module LEFT JOIN FETCH a.ackBy "
            + "WHERE (:status IS NULL OR a.status = :status) ORDER BY a.status, a.createdAt DESC")
    List<StockAlert> findByStatusWithItem(@Param("status") String status);

    @Query("SELECT a FROM StockAlert a JOIN FETCH a.item i JOIN FETCH i.module LEFT JOIN FETCH a.ackBy WHERE a.id = :id")
    Optional<StockAlert> findWithItem(@Param("id") Long id);

    long countByStatus(String status);
}
