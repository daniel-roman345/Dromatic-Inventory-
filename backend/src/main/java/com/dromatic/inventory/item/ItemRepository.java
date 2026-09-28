package com.dromatic.inventory.item;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface ItemRepository extends JpaRepository<Item, Long> {

    @Query("SELECT i FROM Item i JOIN FETCH i.module WHERE i.id = :id")
    Optional<Item> findWithModule(@Param("id") Long id);

    boolean existsByModuleIdAndCode(Long moduleId, String code);

    boolean existsByModuleIdAndCodeAndIdNot(Long moduleId, String code, Long id);

    /** Evita crear dos veces el mismo artículo (mismo nombre y presentación en el módulo). */
    @Query("SELECT i FROM Item i WHERE i.module.id = :moduleId AND LOWER(i.name) = LOWER(:name) "
            + "AND LOWER(COALESCE(i.presentation, '')) = LOWER(COALESCE(:presentation, ''))")
    Optional<Item> findSame(@Param("moduleId") Long moduleId, @Param("name") String name,
                            @Param("presentation") String presentation);
}
