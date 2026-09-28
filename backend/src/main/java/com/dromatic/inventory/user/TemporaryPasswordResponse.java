package com.dromatic.inventory.user;

/**
 * Usuario con la contraseña temporal recién generada. Se muestra UNA sola vez
 * al administrador para que se la entregue a la persona.
 */
public record TemporaryPasswordResponse(UserResponse user, String temporaryPassword) {
}
