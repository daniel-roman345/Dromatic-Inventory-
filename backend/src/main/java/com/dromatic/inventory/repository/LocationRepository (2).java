package com.dromatic.inventory.repository;

import com.dromatic.inventory.model.Location;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LocationRepository extends JpaRepository<Location, Long> {
}
