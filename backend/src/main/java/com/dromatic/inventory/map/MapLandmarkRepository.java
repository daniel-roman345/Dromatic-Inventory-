package com.dromatic.inventory.map;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MapLandmarkRepository extends JpaRepository<MapLandmark, Long> {

    List<MapLandmark> findByAreaIdOrderByIdAsc(Long areaId);
}
