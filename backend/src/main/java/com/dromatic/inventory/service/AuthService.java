package com.dromatic.inventory.service;

import com.dromatic.inventory.dto.LoginRequest;
import com.dromatic.inventory.dto.LoginResponse;
import com.dromatic.inventory.exception.AccountLockedException;
import com.dromatic.inventory.exception.InvalidCredentialsException;
import com.dromatic.inventory.model.User;
import com.dromatic.inventory.repository.UserRepository;
import com.dromatic.inventory.security.JwtUtil;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.time.Duration;
import java.time.LocalDateTime;

@Service
public class AuthService {

    private static final String BAD_CREDENTIALS = "Usuario o contraseña incorrectos.";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final int maxFailedAttempts;
    private final int lockMinutes;

    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtUtil jwtUtil,
                       @Value("${app.security.max-failed-attempts:5}") int maxFailedAttempts,
                       @Value("${app.security.lock-minutes:15}") int lockMinutes) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.maxFailedAttempts = maxFailedAttempts;
        this.lockMinutes = lockMinutes;
    }

    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByUsername(request.getUsername().trim())
                .orElseThrow(() -> new InvalidCredentialsException(BAD_CREDENTIALS));

        if (user.isLocked()) {
            throw new AccountLockedException(lockedMessage(user));
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            registerFailedAttempt(user);
        }

        if (!Boolean.TRUE.equals(user.getActive())) {
            throw new InvalidCredentialsException("Usuario desactivado. Comuníquese con el administrador.");
        }

        if (user.getFailedAttempts() > 0 || user.getLockedUntil() != null) {
            user.setFailedAttempts(0);
            user.setLockedUntil(null);
            userRepository.save(user);
        }

        String role = user.getRole().getName();
        String token = jwtUtil.generateToken(user.getUsername(), role);
        return new LoginResponse(token, user.getUsername(), role, jwtUtil.getExpirationMs());
    }

    /** Suma un intento fallido; al llegar al máximo bloquea la cuenta temporalmente. Siempre lanza excepción. */
    private void registerFailedAttempt(User user) {
        // Si venía de un bloqueo ya vencido, el conteo empieza de nuevo.
        int attempts = user.getLockedUntil() != null ? 1 : user.getFailedAttempts() + 1;
        user.setLockedUntil(null);

        if (attempts >= maxFailedAttempts) {
            user.setFailedAttempts(attempts);
            user.setLockedUntil(LocalDateTime.now().plusMinutes(lockMinutes));
            userRepository.save(user);
            throw new AccountLockedException("Cuenta bloqueada por " + maxFailedAttempts + " intentos fallidos. "
                    + "Intente de nuevo en " + lockMinutes + " minutos o pida al administrador que la desbloquee.");
        }

        user.setFailedAttempts(attempts);
        userRepository.save(user);
        int remaining = maxFailedAttempts - attempts;
        throw new InvalidCredentialsException(BAD_CREDENTIALS + " Le quedan " + remaining
                + (remaining == 1 ? " intento." : " intentos."));
    }

    private String lockedMessage(User user) {
        long minutes = Math.max(1, Duration.between(LocalDateTime.now(), user.getLockedUntil()).toMinutes() + 1);
        return "Cuenta bloqueada por intentos fallidos. Intente de nuevo en " + minutes
                + " minuto(s) o pida al administrador que la desbloquee.";
    }
}
