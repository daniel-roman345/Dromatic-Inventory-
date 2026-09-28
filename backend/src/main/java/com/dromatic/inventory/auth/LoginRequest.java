package com.dromatic.inventory.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record LoginRequest(
        @NotBlank(message = "Escriba su usuario.") @Size(max = 50) String username,
        @NotBlank(message = "Escriba su contraseña.") @Size(max = 100) String password) {
}
