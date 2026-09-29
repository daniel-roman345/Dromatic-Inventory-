package com.dromatic.inventory.map;

import java.util.ArrayList;
import java.util.List;

/**
 * Qué celdas del mapa ocupa cada cosa. Un tramo arranca en (x, y) y sus
 * estanterías se ponen una tras otra en su sentido: → ← (H) o ↓ ↑ (V),
 * cada una con su largo en celdas.
 */
final class MapGeometry {

    private MapGeometry() {
    }

    /** Celda de una estantería (o de un pedazo de una estantería larga). */
    record Cell(int x, int y) {
    }

    /** Paso en x y en y según la orientación y el sentido del tramo. */
    static int[] step(String orientation, boolean reversed) {
        int s = reversed ? -1 : 1;
        return "V".equals(orientation) ? new int[]{0, s} : new int[]{s, 0};
    }

    /** Celdas que ocupa cada estantería del tramo, en orden. */
    static List<List<Cell>> rackCells(int x, int y, String orientation, boolean reversed, List<Integer> lengths) {
        int[] d = step(orientation, reversed);
        List<List<Cell>> out = new ArrayList<>();
        int offset = 0;
        for (int len : lengths) {
            List<Cell> cells = new ArrayList<>();
            for (int k = 0; k < len; k++) {
                cells.add(new Cell(x + d[0] * (offset + k), y + d[1] * (offset + k)));
            }
            out.add(cells);
            offset += len;
        }
        return out;
    }

    static boolean inside(Cell c, int width, int height) {
        return c.x() >= 0 && c.y() >= 0 && c.x() < width && c.y() < height;
    }
}
