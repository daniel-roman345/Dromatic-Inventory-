package com.dromatic.inventory.map;

import java.util.Locale;

/**
 * Letras de las estanterías en orden: A, B, … Z, AA, AB, … Sirve para crear
 * varias estanterías seguidas o un muro que rodea la bodega sin repetir letras.
 */
public final class RackCodes {

    private RackCodes() {
    }

    /** 0 → A, 25 → Z, 26 → AA. */
    public static String fromIndex(int index) {
        StringBuilder sb = new StringBuilder();
        int n = index;
        do {
            sb.insert(0, (char) ('A' + n % 26));
            n = n / 26 - 1;
        } while (n >= 0);
        return sb.toString();
    }

    /** A → 0, Z → 25, AA → 26. Devuelve -1 si no es una letra válida. */
    public static int toIndex(String code) {
        if (code == null || !code.trim().toUpperCase(Locale.ROOT).matches("[A-Z]{1,3}")) {
            return -1;
        }
        int n = 0;
        for (char c : code.trim().toUpperCase(Locale.ROOT).toCharArray()) {
            n = n * 26 + (c - 'A' + 1);
        }
        return n - 1;
    }

    /**
     * Código de la estantería número {@code i} empezando en {@code start}: con
     * letras sigue el abecedario (C, D, E…); con números sigue la cuenta (1, 2, 3…).
     */
    public static String sequence(String start, int i) {
        String s = start == null || start.isBlank() ? "A" : start.trim().toUpperCase(Locale.ROOT);
        if (s.matches("\\d{1,4}")) {
            return String.valueOf(Integer.parseInt(s) + i);
        }
        int base = toIndex(s);
        return base < 0 ? s + (i + 1) : fromIndex(base + i);
    }
}
