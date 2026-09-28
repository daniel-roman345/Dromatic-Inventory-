package com.dromatic.inventory.user;

import org.springframework.stereotype.Component;

import java.security.SecureRandom;

/**
 * Genera contraseñas temporales fáciles de dictar: sin letras ni números que se
 * confundan (0/O, 1/l/I). El usuario debe cambiarla al primer inicio de sesión.
 */
@Component
public class TemporaryPasswordGenerator {

    private static final String LETTERS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz";
    private static final String DIGITS = "23456789";
    private static final SecureRandom RANDOM = new SecureRandom();

    /** Formato: cuatro letras, cuatro números y cuatro letras, ej. "Abcd-2345-Efgh". */
    public String generate() {
        return block(LETTERS, 4) + "-" + block(DIGITS, 4) + "-" + block(LETTERS, 4);
    }

    private static String block(String alphabet, int length) {
        StringBuilder sb = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            sb.append(alphabet.charAt(RANDOM.nextInt(alphabet.length())));
        }
        return sb.toString();
    }
}
