package com.dromatic.inventory.movement;

/**
 * Lo único fijo de un movimiento: qué le pasa al inventario. El nombre del
 * movimiento ("Préstamo", "Devolución", "Despacho"...) lo escribe el usuario.
 */
public enum MovementEffect {
    /** Suma al inventario. */
    ENTRADA,
    /** Resta del inventario. */
    SALIDA,
    /** Cambia de lugar; el total no cambia. */
    TRASLADO,
    /** Corrige el conteo (sube o baja a lo contado). */
    AJUSTE
}
