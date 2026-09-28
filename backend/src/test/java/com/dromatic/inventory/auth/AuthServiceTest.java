package com.dromatic.inventory.auth;

import com.dromatic.inventory.common.exception.AccountLockedException;
import com.dromatic.inventory.common.exception.BusinessException;
import com.dromatic.inventory.common.exception.InvalidCredentialsException;
import com.dromatic.inventory.security.CurrentUserService;
import com.dromatic.inventory.security.JwtUtil;
import com.dromatic.inventory.user.Role;
import com.dromatic.inventory.user.User;
import com.dromatic.inventory.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private JwtUtil jwtUtil;
    @Mock
    private CurrentUserService currentUserService;

    private final PasswordEncoder encoder = new BCryptPasswordEncoder(4);
    private AuthService authService;
    private User user;

    @BeforeEach
    void setUp() {
        authService = new AuthService(userRepository, encoder, jwtUtil, currentUserService);
        ReflectionTestUtils.setField(authService, "maxFailedAttempts", 5);
        ReflectionTestUtils.setField(authService, "lockMinutes", 15);
        user = User.builder()
                .id(1L)
                .username("bodega")
                .fullName("Bodega")
                .password(encoder.encode("Clave2026"))
                .role(Role.builder().id(3L).code(Role.BODEGA).name("Bodega").build())
                .build();
        lenient().when(userRepository.findByUsername("bodega")).thenReturn(Optional.of(user));
    }

    @Test
    void credencialesCorrectas_entraYReiniciaIntentos() {
        user.setFailedAttempts(3);
        when(jwtUtil.generateToken("bodega", Role.BODEGA)).thenReturn("token");

        LoginResponse response = authService.login(new LoginRequest("  Bodega ", "Clave2026"));

        assertEquals("token", response.token());
        assertEquals("BODEGA", response.user().roleCode());
        assertEquals(0, user.getFailedAttempts());
        assertNotNull(user.getLastLoginAt());
    }

    @Test
    void cincoIntentosFallidos_bloqueanLaCuenta() {
        for (int i = 0; i < 4; i++) {
            assertThrows(InvalidCredentialsException.class,
                    () -> authService.login(new LoginRequest("bodega", "mala")));
        }
        assertEquals(4, user.getFailedAttempts());

        assertThrows(AccountLockedException.class, () -> authService.login(new LoginRequest("bodega", "mala")));
        assertTrue(user.isLocked());
        assertEquals(0, user.getFailedAttempts());
    }

    @Test
    void cuentaBloqueada_noEntraNiConLaClaveCorrecta() {
        user.setLockedUntil(LocalDateTime.now().plusMinutes(10));

        AccountLockedException e = assertThrows(AccountLockedException.class,
                () -> authService.login(new LoginRequest("bodega", "Clave2026")));
        assertTrue(e.getMessage().contains("minutos"));
        verifyNoInteractions(jwtUtil);
    }

    @Test
    void avisaCuandoQuedanPocosIntentos() {
        user.setFailedAttempts(3);

        InvalidCredentialsException e = assertThrows(InvalidCredentialsException.class,
                () -> authService.login(new LoginRequest("bodega", "mala")));
        assertTrue(e.getMessage().contains("Le queda 1 intento"), e.getMessage());
    }

    @Test
    void usuarioInactivo_noEntra() {
        user.setActive(false);

        assertThrows(InvalidCredentialsException.class,
                () -> authService.login(new LoginRequest("bodega", "Clave2026")));
    }

    @Test
    void usuarioQueNoExiste_mismoMensajeGenerico() {
        InvalidCredentialsException e = assertThrows(InvalidCredentialsException.class,
                () -> authService.login(new LoginRequest("nadie", "x")));
        assertEquals("Usuario o contraseña incorrectos.", e.getMessage());
    }

    @Test
    void cambioDeClave_exigeLaActualYQuitaLaTemporal() {
        user.setMustChangePassword(true);
        when(currentUserService.currentUser()).thenReturn(user);

        assertThrows(BusinessException.class,
                () -> authService.changePassword(new ChangePasswordRequest("otra", "Nueva2026")));

        MeResponse me = authService.changePassword(new ChangePasswordRequest("Clave2026", "Nueva2026"));
        assertFalse(me.mustChangePassword());
        assertTrue(encoder.matches("Nueva2026", user.getPassword()));
    }
}
