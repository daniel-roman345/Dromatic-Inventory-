package com.dromatic.inventory.lot;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface LotRepository extends JpaRepository<Lot, Long> {

    @Query("SELECT l FROM Lot l JOIN FETCH l.item i JOIN FETCH i.module JOIN FETCH l.createdBy "
            + "LEFT JOIN FETCH l.updatedBy WHERE l.id = :id")
    Optional<Lot> findFull(@Param("id") Long id);

    @Query("SELECT l FROM Lot l JOIN FETCH l.createdBy LEFT JOIN FETCH l.updatedBy WHERE l.item.id = :itemId "
            + "ORDER BY l.labelDate DESC, l.id DESC")
    List<Lot> findByItem(@Param("itemId") Long itemId);
}
