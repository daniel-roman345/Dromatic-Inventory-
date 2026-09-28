package com.dromatic.inventory.common.exception;

/** El recurso solicitado no existe (responde 404). */
public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String message) {
        super(message);
    }
}
