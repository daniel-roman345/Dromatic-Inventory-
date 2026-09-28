package com.dromatic.inventory.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** La nueva contraseña debe tener al menos 8 caracteres, con letras y números. */
public record ChangePasswordRequest(
        @NotBlank(message = "Escriba su contraseña actual.") String currentPassword,
        @NotBlank(message = "Escriba la contraseña nueva.")
        @Size(min = 8, max = 100, message = "La contraseña nueva debe tener entre 8 y 100 caracteres.")
        @Pattern(regexp = "^(?=.*[A-Za-zÁÉÍÓÚÑáéíóúñ])(?=.*\\d).+$",
                message = "La contraseña nueva debe tener letras y números.")
        String newPassword) {
}
