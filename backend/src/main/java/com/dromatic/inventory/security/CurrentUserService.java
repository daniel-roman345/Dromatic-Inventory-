package com.dromatic.inventory.security;

import com.dromatic.inventory.common.exception.ResourceNotFoundException;
import com.dromatic.inventory.user.User;
import com.dromatic.inventory.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

/** Obtiene el usuario que hace la petición actual (la "persona que hace el cambio"). */
@Service
@RequiredArgsConstructor
public class CurrentUserService {

    private final UserRepository userRepository;

    public Long currentUserId() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof CustomUserDetails user) {
            return user.getId();
        }
        throw new ResourceNotFoundException("No hay un usuario autenticado.");
    }

    /** Usuario actual como entidad administrada (llamar dentro de una transacción). */
    public User currentUser() {
        return userRepository.findById(currentUserId())
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado."));
    }
}
