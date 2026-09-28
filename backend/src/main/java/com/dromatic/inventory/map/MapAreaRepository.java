package com.dromatic.inventory.map;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MapAreaRepository extends JpaRepository<MapArea, Long> {

    Optional<MapArea> findByCode(String code);

    boolean existsByCode(String code);

    List<MapArea> findByActiveTrueOrderBySortOrderAsc();
}
