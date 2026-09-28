package com.dromatic.inventory.common.exception;

/** Cuenta bloqueada temporalmente por intentos fallidos (responde 423). */
public class AccountLockedException extends RuntimeException {
    public AccountLockedException(String message) {
        super(message);
    }
}
