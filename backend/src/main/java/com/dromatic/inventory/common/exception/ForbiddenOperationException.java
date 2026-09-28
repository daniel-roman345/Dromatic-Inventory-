package com.dromatic.inventory.common.exception;

/** El rol del usuario no puede realizar la operación (responde 403). */
public class ForbiddenOperationException extends RuntimeException {
    public ForbiddenOperationException(String message) {
        super(message);
    }
}
