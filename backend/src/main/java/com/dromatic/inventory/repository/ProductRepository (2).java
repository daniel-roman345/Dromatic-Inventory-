package com.dromatic.inventory.repository;

import com.dromatic.inventory.model.Product;
import com.dromatic.inventory.model.ProductStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
import java.util.Optional;

public interface ProductRepository extends JpaRepository<Product, Long> {

    Optional<Product> findByCode(String code);

    boolean existsByCode(String code);

    List<Product> findByNameContainingIgnoreCase(String name);

    List<Product> findByLocationId(Long locationId);

    List<Product> findByStatus(ProductStatus status);

    @Query("SELECT p FROM Product p WHERE p.quantity <= p.minimumStock")
    List<Product> findLowStockProducts();
}
