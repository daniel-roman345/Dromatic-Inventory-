package com.dromatic.inventory.service;

import com.dromatic.inventory.dto.LoginRequest;
import com.dromatic.inventory.dto.LoginResponse;
import com.dromatic.inventory.exception.AccountLockedException;
import com.dromatic.inventory.exception.InvalidCredentialsException;
import com.dromatic.inventory.model.Role;
import com.dromatic.inventory.model.User;
import com.dromatic.inventory.repository.UserRepository;
import com.dromatic.inventory.security.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    /** Hash usado en database/database.sql para el administrador inicial. */
    private static final String SEED_HASH = "$2b$10$MpmcNSXGxtWR47.sjyBgRuKok6oE2HiBVXSzfnPozJnzbKnk66Q1q";

    @Mock
    private UserRepository userRepository;
    @Mock
    private JwtUtil jwtUtil;

    private final PasswordEncoder encoder = new BCryptPasswordEncoder(4);
    private AuthService authService;
    private User user;

    @BeforeEach
    void setUp() {
        authService = new AuthService(userRepository, encoder, jwtUtil, 5, 15);
        user = User.builder()
                .id(1L)
                .username("operador1")
                .password(encoder.encode("Password123"))
                .role(Role.builder().name(Role.OPERADOR).build())
                .active(true)
                .build();
        lenient().when(userRepository.findByUsername("operador1")).thenReturn(Optional.of(user));
    }

    @Test
    void credencialesCorrectas_permitenAccesoYReinicianIntentos() {
        user.setFailedAttempts(3);
        when(jwtUtil.generateToken("operador1", Role.OPERADOR)).thenReturn("token-jwt");

        LoginResponse response = authService.login(request("operador1", "Password123"));

        assertEquals("token-jwt", response.getToken());
        assertEquals(Role.OPERADOR, response.getRole());
        assertEquals(0, user.getFailedAttempts());
    }

    @Test
    void contrasenaIncorrecta_esRechazadaYCuentaElIntento() {
        assertThrows(InvalidCredentialsException.class, () -> authService.login(request("operador1", "incorrecta")));
        assertEquals(1, user.getFailedAttempts());
        assertFalse(user.isLocked());
    }

    @Test
    void usuarioInexistente_esRechazado() {
        assertThrows(InvalidCredentialsException.class, () -> authService.login(request("noexiste", "Password123")));
    }

    @Test
    void cincoIntentosFallidos_bloqueanLaCuenta() {
        for (int i = 1; i <= 4; i++) {
            assertThrows(InvalidCredentialsException.class, () -> authService.login(request("operador1", "incorrecta")));
        }
        assertThrows(AccountLockedException.class, () -> authService.login(request("operador1", "incorrecta")));
        assertTrue(user.isLocked());

        // Aun con la contraseña correcta sigue bloqueada mientras dure el bloqueo.
        assertThrows(AccountLockedException.class, () -> authService.login(request("operador1", "Password123")));
        verify(jwtUtil, never()).generateToken(any(), any());
    }

    @Test
    void usuarioDesactivado_noPuedeIngresar() {
        user.setActive(false);
        assertThrows(InvalidCredentialsException.class, () -> authService.login(request("operador1", "Password123")));
        verify(jwtUtil, never()).generateToken(any(), any());
    }

    @Test
    void lasContrasenasSeGuardanComoHashBCrypt() {
        assertNotEquals("Password123", user.getPassword());
        assertTrue(new BCryptPasswordEncoder().matches("Password123", SEED_HASH));
    }

    private static LoginRequest request(String username, String password) {
        LoginRequest request = new LoginRequest();
        request.setUsername(username);
        request.setPassword(password);
        return request;
    }
}
