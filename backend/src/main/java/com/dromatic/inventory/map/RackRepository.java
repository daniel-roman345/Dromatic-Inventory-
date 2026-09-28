package com.dromatic.inventory.map;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface RackRepository extends JpaRepository<Rack, Long> {

    @Query("SELECT r FROM Rack r WHERE r.section.area.id = :areaId AND r.active = true ORDER BY r.section.id, r.position, r.code")
    List<Rack> findActiveByArea(@Param("areaId") Long areaId);

    @Query("SELECT r FROM Rack r WHERE r.section.id = :sectionId AND r.active = true ORDER BY r.position, r.code")
    List<Rack> findActiveBySection(@Param("sectionId") Long sectionId);

    /** Estantería con su sección y área cargadas, para describir la ubicación. */
    @Query("SELECT r FROM Rack r JOIN FETCH r.section s JOIN FETCH s.area LEFT JOIN FETCH s.module WHERE r.id = :id")
    Optional<Rack> findWithLocation(@Param("id") Long id);

    Optional<Rack> findBySectionIdAndCode(Long sectionId, String code);

    /** Incluye las archivadas. */
    List<Rack> findBySectionId(Long sectionId);
}
