package com.dromatic.inventory.suggestion;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface SuggestionRepository extends JpaRepository<Suggestion, Long> {

    /** Valores base del módulo más los generales. */
    @Query("SELECT s FROM Suggestion s LEFT JOIN FETCH s.module WHERE s.active = true "
            + "AND (s.module IS NULL OR :moduleId IS NULL OR s.module.id = :moduleId) ORDER BY s.kind, s.sortOrder, s.value")
    List<Suggestion> findActive(@Param("moduleId") Long moduleId);

    @Query("SELECT s FROM Suggestion s LEFT JOIN FETCH s.module ORDER BY s.kind, s.sortOrder, s.value")
    List<Suggestion> findAllForAdmin();
}
