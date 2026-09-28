package com.dromatic.inventory.user;

import java.time.LocalDateTime;

public record UserResponse(
        Long id,
        String username,
        String fullName,
        String jobTitle,
        String email,
        String phone,
        String roleCode,
        String roleName,
        boolean active,
        boolean mustChangePassword,
        boolean receivesStockAlerts,
        boolean locked,
        LocalDateTime lastLoginAt,
        LocalDateTime createdAt) {

    public static UserResponse from(User u) {
        return new UserResponse(u.getId(), u.getUsername(), u.getFullName(), u.getJobTitle(), u.getEmail(),
                u.getPhone(), u.getRole().getCode(), u.getRole().getName(), Boolean.TRUE.equals(u.getActive()),
                Boolean.TRUE.equals(u.getMustChangePassword()), Boolean.TRUE.equals(u.getReceivesStockAlerts()),
                u.isLocked(), u.getLastLoginAt(), u.getCreatedAt());
    }
}
