package com.dromatic.inventory.auth;

import com.dromatic.inventory.user.User;

/**
 * Usuario que tiene la sesión abierta.
 *
 * @param mustChangePassword TRUE mientras use la contraseña temporal
 */
public record MeResponse(
        Long id,
        String username,
        String fullName,
        String jobTitle,
        String roleCode,
        String roleName,
        boolean admin,
        boolean mustChangePassword) {

    public static MeResponse from(User u) {
        return new MeResponse(u.getId(), u.getUsername(), u.getFullName(), u.getJobTitle(),
                u.getRole().getCode(), u.getRole().getName(), u.isAdmin(),
                Boolean.TRUE.equals(u.getMustChangePassword()));
    }
}
