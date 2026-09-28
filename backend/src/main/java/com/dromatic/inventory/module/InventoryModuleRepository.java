package com.dromatic.inventory.module;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface InventoryModuleRepository extends JpaRepository<InventoryModule, Long> {

    Optional<InventoryModule> findByCode(String code);

    List<InventoryModule> findByActiveTrueOrderBySortOrderAsc();
}
