package com.dromatic.inventory.user;

import com.dromatic.inventory.common.exception.BusinessException;
import com.dromatic.inventory.common.exception.DuplicateResourceException;
import com.dromatic.inventory.common.exception.ResourceNotFoundException;
import com.dromatic.inventory.security.CurrentUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;

/** Administración de usuarios. Solo el administrador llega aquí (ver SecurityConfig). */
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final TemporaryPasswordGenerator passwordGenerator;
    private final CurrentUserService currentUserService;

    @Transactional(readOnly = true)
    public List<UserResponse> findAll() {
        return userRepository.findAllByOrderByFullNameAsc().stream().map(UserResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public List<RoleResponse> roles() {
        return roleRepository.findAll().stream().map(RoleResponse::from).toList();
    }

    @Transactional
    public TemporaryPasswordResponse create(UserRequest request) {
        String username = normalizeUsername(request.username());
        if (userRepository.existsByUsername(username)) {
            throw new DuplicateResourceException("Ya existe el usuario " + username + ".");
        }
        String email = blankToNull(request.email());
        if (email != null && userRepository.existsByEmail(email)) {
            throw new DuplicateResourceException("Ese correo ya está asignado a otro usuario.");
        }
        String temporaryPassword = passwordGenerator.generate();
        User user = User.builder()
                .username(username)
                .fullName(request.fullName().trim())
                .jobTitle(blankToNull(request.jobTitle()))
                .email(email)
                .phone(blankToNull(request.phone()))
                .role(findRole(request.roleCode()))
                .password(passwordEncoder.encode(temporaryPassword))
                .mustChangePassword(true)
                .receivesStockAlerts(Boolean.TRUE.equals(request.receivesStockAlerts()))
                .active(request.active() == null || request.active())
                .build();
        return new TemporaryPasswordResponse(UserResponse.from(userRepository.save(user)), temporaryPassword);
    }

    @Transactional
    public UserResponse update(Long id, UserRequest request) {
        User user = get(id);
        String username = normalizeUsername(request.username());
        if (userRepository.existsByUsernameAndIdNot(username, id)) {
            throw new DuplicateResourceException("Ya existe el usuario " + username + ".");
        }
        String email = blankToNull(request.email());
        if (email != null && userRepository.existsByEmailAndIdNot(email, id)) {
            throw new DuplicateResourceException("Ese correo ya está asignado a otro usuario.");
        }
        Role role = findRole(request.roleCode());
        boolean active = request.active() == null || request.active();
        guardLastAdmin(user, role, active);

        user.setUsername(username);
        user.setFullName(request.fullName().trim());
        user.setJobTitle(blankToNull(request.jobTitle()));
        user.setEmail(email);
        user.setPhone(blankToNull(request.phone()));
        user.setRole(role);
        user.setReceivesStockAlerts(Boolean.TRUE.equals(request.receivesStockAlerts()));
        user.setActive(active);
        return UserResponse.from(user);
    }

    @Transactional
    public UserResponse setActive(Long id, boolean active) {
        User user = get(id);
        guardLastAdmin(user, user.getRole(), active);
        user.setActive(active);
        return UserResponse.from(user);
    }

    @Transactional
    public UserResponse unlock(Long id) {
        User user = get(id);
        user.setFailedAttempts(0);
        user.setLockedUntil(null);
        return UserResponse.from(user);
    }

    /** Genera una nueva contraseña temporal (por ejemplo, si la persona la olvidó). */
    @Transactional
    public TemporaryPasswordResponse resetPassword(Long id) {
        User user = get(id);
        String temporaryPassword = passwordGenerator.generate();
        user.setPassword(passwordEncoder.encode(temporaryPassword));
        user.setMustChangePassword(true);
        user.setFailedAttempts(0);
        user.setLockedUntil(null);
        return new TemporaryPasswordResponse(UserResponse.from(user), temporaryPassword);
    }

    private User get(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("El usuario no existe."));
    }

    private Role findRole(String code) {
        return roleRepository.findByCode(code.trim().toUpperCase(Locale.ROOT))
                .orElseThrow(() -> new BusinessException("El rol " + code + " no existe."));
    }

    /** Siempre debe quedar al menos un administrador activo, y nadie se quita el acceso a sí mismo. */
    private void guardLastAdmin(User user, Role newRole, boolean newActive) {
        boolean losesAdmin = user.isAdmin() && Boolean.TRUE.equals(user.getActive())
                && (!Role.ADMIN.equals(newRole.getCode()) || !newActive);
        if (!losesAdmin) {
            return;
        }
        if (user.getId().equals(currentUserService.currentUserId())) {
            throw new BusinessException("No puede quitarse a sí mismo el rol de administrador ni desactivarse.");
        }
        if (userRepository.countByRole_CodeAndActiveTrue(Role.ADMIN) <= 1) {
            throw new BusinessException("Debe quedar al menos un administrador activo.");
        }
    }

    private static String normalizeUsername(String username) {
        return username.trim().toLowerCase(Locale.ROOT);
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
