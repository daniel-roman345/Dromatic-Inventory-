package com.dromatic.inventory.config;

import com.dromatic.inventory.model.Role;
import com.dromatic.inventory.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

/**
 * Garantiza que los 3 roles base existan al iniciar la aplicación.
 * Los usuarios/productos de prueba se cargan mediante database.sql (no aquí),
 * para no duplicar datos ya definidos explícitamente en la base de datos.
 */
@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final RoleRepository roleRepository;

    @Override
    public void run(String... args) {
        crearRolSiNoExiste("ADMINISTRADOR");
        crearRolSiNoExiste("OPERADOR");
        crearRolSiNoExiste("CONSULTA");
    }

    private void crearRolSiNoExiste(String nombre) {
        roleRepository.findByName(nombre).orElseGet(() ->
            roleRepository.save(Role.builder().name(nombre).build())
        );
    }
}
