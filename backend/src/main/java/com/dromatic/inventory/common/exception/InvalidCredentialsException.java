package com.dromatic.inventory.common.exception;

/** Usuario o contraseña incorrectos, o usuario desactivado (responde 401). */
public class InvalidCredentialsException extends RuntimeException {
    public InvalidCredentialsException(String message) {
        super(message);
    }
}
