package com.dromatic.inventory.user;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Datos de un usuario. La contraseña no se escribe aquí: el sistema genera una
 * temporal y la persona la cambia al entrar por primera vez.
 *
 * @param phone WhatsApp con indicativo y sin "+", ej. 573001234567 (opcional)
 */
public record UserRequest(
        @NotBlank(message = "Escriba el usuario.")
        @Size(min = 3, max = 50, message = "El usuario debe tener entre 3 y 50 caracteres.")
        @Pattern(regexp = "^[A-Za-z0-9._-]+$", message = "El usuario solo puede tener letras, números, punto, guion y guion bajo.")
        String username,
        @NotBlank(message = "Escriba el nombre completo.") @Size(max = 120) String fullName,
        @Size(max = 80) String jobTitle,
        @Email(message = "El correo no es válido.") @Size(max = 120) String email,
        @Pattern(regexp = "^$|^\\d{10,15}$", message = "El WhatsApp debe tener solo números, con el indicativo del país (ej. 573001234567).")
        String phone,
        @NotBlank(message = "Escoja el rol.") String roleCode,
        Boolean receivesStockAlerts,
        Boolean active) {
}
