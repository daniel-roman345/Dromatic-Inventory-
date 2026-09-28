package com.dromatic.inventory.map;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface MapSectionRepository extends JpaRepository<MapSection, Long> {

    @Query("SELECT s FROM MapSection s LEFT JOIN FETCH s.module WHERE s.area.id = :areaId ORDER BY s.sortOrder, s.code")
    List<MapSection> findByAreaWithModule(@Param("areaId") Long areaId);

    boolean existsByAreaIdAndCode(Long areaId, String code);

    boolean existsByAreaIdAndCodeAndIdNot(Long areaId, String code, Long id);
}
