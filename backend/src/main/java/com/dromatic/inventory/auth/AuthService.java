package com.dromatic.inventory.auth;

import com.dromatic.inventory.common.exception.AccountLockedException;
import com.dromatic.inventory.common.exception.BusinessException;
import com.dromatic.inventory.common.exception.InvalidCredentialsException;
import com.dromatic.inventory.security.CurrentUserService;
import com.dromatic.inventory.security.JwtUtil;
import com.dromatic.inventory.user.User;
import com.dromatic.inventory.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Locale;

/**
 * Inicio de sesión con bloqueo temporal: después de N intentos fallidos seguidos
 * la cuenta queda bloqueada unos minutos (por defecto 5 intentos y 15 minutos).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private static final String BAD_CREDENTIALS = "Usuario o contraseña incorrectos.";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final CurrentUserService currentUserService;

    @Value("${app.security.max-failed-attempts:5}")
    private int maxFailedAttempts;

    @Value("${app.security.lock-minutes:15}")
    private int lockMinutes;

    /** Los intentos fallidos se guardan aunque se lance la excepción. */
    @Transactional(noRollbackFor = {InvalidCredentialsException.class, AccountLockedException.class})
    public LoginResponse login(LoginRequest request) {
        String username = request.username().trim().toLowerCase(Locale.ROOT);
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new InvalidCredentialsException(BAD_CREDENTIALS));

        if (user.isLocked()) {
            throw new AccountLockedException(lockedMessage(user.getLockedUntil()));
        }

        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            int attempts = user.getFailedAttempts() + 1;
            if (attempts >= maxFailedAttempts) {
                user.setFailedAttempts(0);
                user.setLockedUntil(LocalDateTime.now().plusMinutes(lockMinutes));
                log.warn("Cuenta '{}' bloqueada {} minutos por intentos fallidos.", username, lockMinutes);
                throw new AccountLockedException(lockedMessage(user.getLockedUntil()));
            }
            user.setFailedAttempts(attempts);
            int left = maxFailedAttempts - attempts;
            throw new InvalidCredentialsException(BAD_CREDENTIALS + (left <= 2
                    ? " Le queda" + (left == 1 ? " 1 intento" : "n " + left + " intentos") + " antes del bloqueo."
                    : ""));
        }

        if (!Boolean.TRUE.equals(user.getActive())) {
            throw new InvalidCredentialsException("Su usuario está inactivo. Hable con el administrador del sistema.");
        }

        user.setFailedAttempts(0);
        user.setLockedUntil(null);
        user.setLastLoginAt(LocalDateTime.now());
        String token = jwtUtil.generateToken(user.getUsername(), user.getRole().getCode());
        return new LoginResponse(token, jwtUtil.getExpirationMs(), MeResponse.from(user));
    }

    @Transactional(readOnly = true)
    public MeResponse me() {
        return MeResponse.from(currentUserService.currentUser());
    }

    @Transactional
    public MeResponse changePassword(ChangePasswordRequest request) {
        User user = currentUserService.currentUser();
        if (!passwordEncoder.matches(request.currentPassword(), user.getPassword())) {
            throw new BusinessException("La contraseña actual no es correcta.");
        }
        if (passwordEncoder.matches(request.newPassword(), user.getPassword())) {
            throw new BusinessException("La contraseña nueva debe ser diferente a la actual.");
        }
        user.setPassword(passwordEncoder.encode(request.newPassword()));
        user.setMustChangePassword(false);
        return MeResponse.from(user);
    }

    private static String lockedMessage(LocalDateTime lockedUntil) {
        long minutes = Math.max(1, Duration.between(LocalDateTime.now(), lockedUntil).toMinutes() + 1);
        return "La cuenta está bloqueada por varios intentos fallidos. Intente de nuevo en "
                + minutes + (minutes == 1 ? " minuto." : " minutos.");
    }
}
