package com.dromatic.inventory.service;

import com.dromatic.inventory.dto.UserRequest;
import com.dromatic.inventory.dto.UserResponse;
import com.dromatic.inventory.exception.BusinessException;
import com.dromatic.inventory.exception.DuplicateResourceException;
import com.dromatic.inventory.exception.ResourceNotFoundException;
import com.dromatic.inventory.model.Role;
import com.dromatic.inventory.model.User;
import com.dromatic.inventory.repository.RoleRepository;
import com.dromatic.inventory.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private static final int MIN_PASSWORD_LENGTH = 8;

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public List<UserResponse> findAll() {
        return userRepository.findAllByOrderByUsernameAsc().stream().map(this::toResponse).toList();
    }

    @Transactional
    public UserResponse create(UserRequest request) {
        String username = request.getUsername().trim();
        String email = normalizeEmail(request.getEmail());

        if (userRepository.existsByUsername(username)) {
            throw new DuplicateResourceException("El nombre de usuario ya existe.");
        }
        if (email != null && userRepository.existsByEmail(email)) {
            throw new DuplicateResourceException("El correo ya está registrado.");
        }
        if (request.getPassword() == null || request.getPassword().isBlank()) {
            throw new BusinessException("La contraseña es obligatoria.");
        }
        validatePassword(request.getPassword());

        User user = User.builder()
                .username(username)
                .email(email)
                .password(passwordEncoder.encode(request.getPassword()))
                .role(getRole(request.getRole()))
                .active(request.getActive() == null || request.getActive())
                .build();

        return toResponse(userRepository.save(user));
    }

    @Transactional
    public UserResponse update(Long id, UserRequest request, String currentUsername) {
        User user = getUserOrThrow(id);
        String email = normalizeEmail(request.getEmail());
        boolean isSelf = user.getUsername().equalsIgnoreCase(currentUsername);

        if (email != null && !email.equalsIgnoreCase(user.getEmail()) && userRepository.existsByEmail(email)) {
            throw new DuplicateResourceException("El correo ya está registrado.");
        }
        if (isSelf && !user.getRole().getName().equals(request.getRole())) {
            throw new BusinessException("No puede cambiar su propio rol.");
        }
        if (isSelf && Boolean.FALSE.equals(request.getActive())) {
            throw new BusinessException("No puede desactivar su propio usuario.");
        }

        user.setEmail(email);
        user.setRole(getRole(request.getRole()));
        if (request.getActive() != null) {
            user.setActive(request.getActive());
        }
        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            validatePassword(request.getPassword());
            user.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        return toResponse(userRepository.save(user));
    }

    @Transactional
    public void setActive(Long id, boolean active, String currentUsername) {
        User user = getUserOrThrow(id);
        if (!active && user.getUsername().equalsIgnoreCase(currentUsername)) {
            throw new BusinessException("No puede desactivar su propio usuario.");
        }
        user.setActive(active);
        userRepository.save(user);
    }

    @Transactional
    public void unlock(Long id) {
        User user = getUserOrThrow(id);
        user.setFailedAttempts(0);
        user.setLockedUntil(null);
        userRepository.save(user);
    }

    private User getUserOrThrow(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado."));
    }

    private Role getRole(String name) {
        return roleRepository.findByName(name)
                .orElseThrow(() -> new ResourceNotFoundException("Rol no encontrado: " + name));
    }

    private static void validatePassword(String password) {
        if (password.length() < MIN_PASSWORD_LENGTH) {
            throw new BusinessException("La contraseña debe tener al menos " + MIN_PASSWORD_LENGTH + " caracteres.");
        }
    }

    private static String normalizeEmail(String email) {
        return (email == null || email.isBlank()) ? null : email.trim().toLowerCase();
    }

    private UserResponse toResponse(User u) {
        return UserResponse.builder()
                .id(u.getId())
                .username(u.getUsername())
                .email(u.getEmail())
                .role(u.getRole().getName())
                .active(u.getActive())
                .locked(u.isLocked())
                .lockedUntil(u.isLocked() ? u.getLockedUntil() : null)
                .createdAt(u.getCreatedAt())
                .build();
    }
}
