package com.dromatic.inventory.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import java.time.LocalDateTime;

@Getter @Builder @AllArgsConstructor
public class UserResponse {
    private Long id;
    private String username;
    private String email;
    private String role;
    private Boolean active;
    private boolean locked;
    private LocalDateTime lockedUntil;
    private LocalDateTime createdAt;
}
