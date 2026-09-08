package com.dromatic.inventory.service;

import com.dromatic.inventory.dto.LoginRequest;
import com.dromatic.inventory.dto.LoginResponse;
import com.dromatic.inventory.exception.InvalidCredentialsException;
import com.dromatic.inventory.model.User;
import com.dromatic.inventory.repository.UserRepository;
import com.dromatic.inventory.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new InvalidCredentialsException("Credenciales incorrectas."));

        if (!Boolean.TRUE.equals(user.getActive())) {
            throw new InvalidCredentialsException("Usuario no autorizado.");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new InvalidCredentialsException("Credenciales incorrectas.");
        }

        String token = jwtUtil.generateToken(user.getUsername(), user.getRole().getName());
        return new LoginResponse(token, user.getUsername(), user.getEmail(), user.getRole().getName());
    }
}
