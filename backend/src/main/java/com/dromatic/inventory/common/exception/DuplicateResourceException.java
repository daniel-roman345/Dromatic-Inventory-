package com.dromatic.inventory.common.exception;

/** El registro ya existe (responde 409). */
public class DuplicateResourceException extends RuntimeException {
    public DuplicateResourceException(String message) {
        super(message);
    }
}
