package com.dromatic.inventory.map;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

/** Letras seguidas y celdas de los tramos en las cuatro direcciones. */
class MapGeometryTest {

    @Test
    void letrasSiguenElAbecedario() {
        assertEquals("A", RackCodes.sequence("A", 0));
        assertEquals("I", RackCodes.sequence("A", 8));
        assertEquals("AA", RackCodes.sequence("Z", 1));
        assertEquals("D", RackCodes.sequence("c", 1));
        assertEquals("12", RackCodes.sequence("10", 2));
    }

    @Test
    void tramoHaciaLaDerechaYEstanteriaLarga() {
        var cells = MapGeometry.rackCells(2, 0, "H", false, List.of(1, 3));
        assertEquals(new MapGeometry.Cell(2, 0), cells.get(0).get(0));
        assertEquals(List.of(new MapGeometry.Cell(3, 0), new MapGeometry.Cell(4, 0), new MapGeometry.Cell(5, 0)), cells.get(1));
    }

    @Test
    void tramoHaciaArribaParaRodearLaBodega() {
        var cells = MapGeometry.rackCells(0, 9, "V", true, List.of(1, 1, 1));
        assertEquals(new MapGeometry.Cell(0, 9), cells.get(0).get(0));
        assertEquals(new MapGeometry.Cell(0, 7), cells.get(2).get(0));
    }
}
