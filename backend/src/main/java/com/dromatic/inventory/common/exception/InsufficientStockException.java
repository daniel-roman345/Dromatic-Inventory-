package com.dromatic.inventory.common.exception;

/** La operación dejaría una existencia negativa (responde 400). */
public class InsufficientStockException extends RuntimeException {
    public InsufficientStockException(String message) {
        super(message);
    }
}
