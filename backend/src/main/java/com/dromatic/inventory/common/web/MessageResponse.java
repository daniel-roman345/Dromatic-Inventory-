package com.dromatic.inventory.common.web;

/**
 * Respuesta simple con un mensaje para mostrar al usuario.
 *
 * @param message texto en español listo para mostrar
 * @param code    código opcional para que el frontend reaccione (ej. PASSWORD_CHANGE_REQUIRED)
 */
public record MessageResponse(String message, String code) {

    public MessageResponse(String message) {
        this(message, null);
    }
}
