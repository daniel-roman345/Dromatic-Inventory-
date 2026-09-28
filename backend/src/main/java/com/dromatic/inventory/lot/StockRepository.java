package com.dromatic.inventory.lot;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

public interface StockRepository extends JpaRepository<Stock, Long> {

    /** Bloquea la fila mientras se descuenta, para que dos personas no saquen lo mismo a la vez. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM Stock s JOIN FETCH s.lot l JOIN FETCH l.item i JOIN FETCH i.module WHERE s.id = :id")
    Optional<Stock> findForUpdate(@Param("id") Long id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM Stock s WHERE s.lot.id = :lotId AND s.rack.id = :rackId AND s.level = :level")
    Optional<Stock> findAtRack(@Param("lotId") Long lotId, @Param("rackId") Long rackId, @Param("level") Integer level);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM Stock s WHERE s.lot.id = :lotId AND s.rack IS NULL "
            + "AND ((:note IS NULL AND s.locationNote IS NULL) OR s.locationNote = :note)")
    Optional<Stock> findAtNote(@Param("lotId") Long lotId, @Param("note") String note);

    /** Existencias de un artículo con su ubicación completa. */
    @Query("SELECT s FROM Stock s JOIN FETCH s.lot l LEFT JOIN FETCH s.rack r LEFT JOIN FETCH r.section sec "
            + "LEFT JOIN FETCH sec.area WHERE l.item.id = :itemId AND s.quantity > 0 ORDER BY l.labelDate DESC, s.id")
    List<Stock> findByItem(@Param("itemId") Long itemId);

    @Query("SELECT s FROM Stock s LEFT JOIN FETCH s.rack r LEFT JOIN FETCH r.section sec LEFT JOIN FETCH sec.area "
            + "WHERE s.lot.id = :lotId AND s.quantity > 0 ORDER BY s.id")
    List<Stock> findByLot(@Param("lotId") Long lotId);

    /** Lo que hay en un piso de una estantería (clic en el mapa). */
    @Query("SELECT s FROM Stock s JOIN FETCH s.lot l JOIN FETCH l.item i JOIN FETCH i.module "
            + "WHERE s.rack.id = :rackId AND s.level = :level AND s.quantity > 0 ORDER BY i.name, l.labelDate")
    List<Stock> findAtLocation(@Param("rackId") Long rackId, @Param("level") Integer level);

    @Query("SELECT COALESCE(SUM(s.quantity), 0) FROM Stock s WHERE s.lot.item.id = :itemId")
    BigDecimal totalByItem(@Param("itemId") Long itemId);
}
