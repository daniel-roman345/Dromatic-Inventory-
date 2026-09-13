package com.dromatic.inventory.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class UserRequest {

    @NotBlank(message = "El nombre de usuario es obligatorio")
    @Size(min = 3, max = 50, message = "El usuario debe tener entre 3 y 50 caracteres")
    @Pattern(regexp = "^[A-Za-z0-9._-]+$", message = "El usuario solo puede tener letras, números, punto, guion y guion bajo")
    private String username;

    /** Opcional: no se usa para iniciar sesión. */
    @Email(message = "El correo no es válido")
    @Size(max = 100, message = "El correo no puede superar 100 caracteres")
    private String email;

    /** Obligatoria al crear; al editar, vacía significa "no cambiar". */
    @Size(max = 100, message = "La contraseña no puede superar 100 caracteres")
    private String password;

    @NotBlank(message = "El rol es obligatorio")
    @Pattern(regexp = "ADMINISTRADOR|OPERADOR|CONSULTA", message = "Rol no válido")
    private String role;

    private Boolean active;
}
