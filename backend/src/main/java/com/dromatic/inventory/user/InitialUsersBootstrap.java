package com.dromatic.inventory.user;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

/**
 * Crea los usuarios iniciales la primera vez que el sistema arranca con la base vacía.
 * <p>
 * Cada usuario recibe una contraseña temporal aleatoria que debe cambiar al entrar.
 * Las contraseñas se escriben en {@code .credenciales.txt} (excluido de git) para que
 * el administrador las entregue; nunca quedan en el código ni en el repositorio.
 * El correo y el WhatsApp de quien recibe las alertas se toman de {@code .env}.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class InitialUsersBootstrap implements ApplicationRunner {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final TemporaryPasswordGenerator passwordGenerator;

    @Value("${app.bootstrap.credentials-file:.credenciales.txt}")
    private String credentialsFile;

    @Value("${app.alerts.initial-email:}")
    private String alertEmail;

    @Value("${app.alerts.initial-whatsapp:}")
    private String alertWhatsapp;

    private record Seed(String username, String fullName, String jobTitle, String role, boolean alerts) {
    }

    /** Personas conocidas; el administrador ajusta nombres y agrega más desde Usuarios. */
    private static final List<Seed> SEEDS = List.of(
            new Seed("daniel", "Daniel Roman", "Bodega · administrador del sistema", Role.ADMIN, false),
            new Seed("fabio", "Fabio", "Jefatura", Role.JEFE, false),
            new Seed("mvargas", "Mónica Vargas", "Jefe de personal", Role.JEFE, false),
            new Seed("magola", "Magola", "Jefe de compras", Role.JEFE, true),
            new Seed("bodega", "Bodega", "Auxiliar de bodega", Role.BODEGA, false),
            new Seed("produccion1", "Producción 1", "Producción", Role.PRODUCCION, false),
            new Seed("produccion2", "Producción 2", "Producción", Role.PRODUCCION, false),
            new Seed("produccion3", "Producción 3", "Producción", Role.PRODUCCION, false),
            new Seed("consulta", "Consulta general", "Equipo de consulta", Role.CONSULTA, false));

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (userRepository.count() > 0) {
            return;
        }
        List<String> lines = new ArrayList<>();
        for (Seed seed : SEEDS) {
            Role role = roleRepository.findByCode(seed.role())
                    .orElseThrow(() -> new IllegalStateException("Falta el rol " + seed.role() + " (migración V2)."));
            String password = passwordGenerator.generate();
            User user = User.builder()
                    .username(seed.username())
                    .fullName(seed.fullName())
                    .jobTitle(seed.jobTitle())
                    .role(role)
                    .password(passwordEncoder.encode(password))
                    .mustChangePassword(true)
                    .receivesStockAlerts(seed.alerts())
                    .email(seed.alerts() ? blankToNull(alertEmail) : null)
                    .phone(seed.alerts() ? blankToNull(alertWhatsapp) : null)
                    .build();
            userRepository.save(user);
            lines.add(String.format("  %-12s  %-24s  %-12s  %s", seed.username(), password, seed.role(), seed.fullName()));
        }
        writeCredentials(lines);
    }

    private void writeCredentials(List<String> lines) {
        Path path = Path.of(credentialsFile).toAbsolutePath();
        List<String> content = new ArrayList<>();
        content.add("");
        content.add("DIS v2 · usuarios iniciales · " + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")));
        content.add("Contraseñas TEMPORALES: cada persona debe cambiarla al entrar por primera vez.");
        content.add("Entréguelas en persona y borre este archivo cuando todos hayan entrado.");
        content.add(String.format("  %-12s  %-24s  %-12s  %s", "USUARIO", "CONTRASEÑA TEMPORAL", "ROL", "NOMBRE"));
        content.addAll(lines);
        try {
            Files.write(path, content, StandardCharsets.UTF_8, StandardOpenOption.CREATE, StandardOpenOption.APPEND);
            log.warn("Se crearon {} usuarios iniciales. Las contraseñas temporales están en {}", lines.size(), path);
        } catch (IOException e) {
            // Sin archivo no hay forma de conocer las contraseñas: se muestran una sola vez en la consola.
            log.error("No se pudo escribir {}. Contraseñas temporales:\n{}", path, String.join("\n", content));
        }
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
