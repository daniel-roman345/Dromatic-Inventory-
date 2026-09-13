package com.dromatic.inventory.model;

import java.util.List;

/** Motivos permitidos para cada tipo de movimiento. */
public final class MovementReasons {

    public static final String INITIAL_STOCK = "Inventario inicial";

    public static final List<String> ENTRY = List.of(
            "Compra a proveedor",
            "Producción",
            "Devolución de cliente",
            "Ajuste de inventario",
            INITIAL_STOCK
    );

    public static final List<String> EXIT = List.of(
            "Despacho / Venta",
            "Producción",
            "Devolución a proveedor",
            "Producto dañado o vencido",
            "Ajuste de inventario"
    );

    private MovementReasons() {
    }

    public static List<String> forType(MovementType type) {
        return type == MovementType.ENTRADA ? ENTRY : EXIT;
    }
}
