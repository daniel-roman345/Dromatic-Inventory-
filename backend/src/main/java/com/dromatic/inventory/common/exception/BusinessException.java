package com.dromatic.inventory.common.exception;

/** Regla de negocio incumplida (responde 400). */
public class BusinessException extends RuntimeException {
    public BusinessException(String message) {
        super(message);
    }
}
