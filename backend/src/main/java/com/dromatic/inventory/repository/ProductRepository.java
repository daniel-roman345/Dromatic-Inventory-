package com.dromatic.inventory.repository;

import com.dromatic.inventory.model.Product;
import com.dromatic.inventory.model.ProductStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface ProductRepository extends JpaRepository<Product, Long> {

    boolean existsByCode(String code);

    boolean existsByLocationId(Long locationId);

    long countByStatus(ProductStatus status);

    /** Busca por código o nombre (parcial, sin distinguir mayúsculas) y opcionalmente por estado. */
    @Query("SELECT p FROM Product p JOIN FETCH p.location " +
           "WHERE (:q IS NULL OR LOWER(p.code) LIKE LOWER(CONCAT('%', :q, '%')) " +
           "       OR LOWER(p.name) LIKE LOWER(CONCAT('%', :q, '%'))) " +
           "AND (:status IS NULL OR p.status = :status) " +
           "ORDER BY p.name")
    List<Product> search(@Param("q") String q, @Param("status") ProductStatus status);

    @Query("SELECT p FROM Product p JOIN FETCH p.location " +
           "WHERE p.quantity <= p.minimumStock AND p.status = com.dromatic.inventory.model.ProductStatus.ACTIVO " +
           "ORDER BY (p.quantity - p.minimumStock), p.name")
    List<Product> findLowStockProducts();

    @Query("SELECT COUNT(p) FROM Product p " +
           "WHERE p.quantity <= p.minimumStock AND p.status = com.dromatic.inventory.model.ProductStatus.ACTIVO")
    long countLowStock();

    @Query("SELECT COALESCE(SUM(p.quantity), 0) FROM Product p " +
           "WHERE p.status = com.dromatic.inventory.model.ProductStatus.ACTIVO")
    Long sumActiveQuantity();

    /** Bloquea la fila del producto mientras se actualiza su stock (evita inconsistencias con usuarios simultáneos). */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM Product p WHERE p.id = :id")
    Optional<Product> findByIdForUpdate(@Param("id") Long id);
}
