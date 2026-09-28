package com.dromatic.inventory.user;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByUsername(String username);

    boolean existsByUsername(String username);

    boolean existsByUsernameAndIdNot(String username, Long id);

    boolean existsByEmail(String email);

    boolean existsByEmailAndIdNot(String email, Long id);

    List<User> findAllByOrderByFullNameAsc();

    long countByRole_CodeAndActiveTrue(String roleCode);

    /** Destinatarios activos de las alertas de stock bajo. */
    List<User> findByActiveTrueAndReceivesStockAlertsTrue();
}
