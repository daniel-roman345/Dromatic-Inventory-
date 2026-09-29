package com.dromatic.inventory.lot;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

/** Puntos de color del rótulo: el amarillo se deja al pegar el verde, como en el papel. */
class QualityStickersTest {

    @Test
    void amarilloYVerde_quedaAprobadoConLosDosPuntos() {
        Lot lot = new Lot();
        LotService.applyQuality(lot, List.of("APROBADO", "CUARENTENA"), null);

        assertEquals("CUARENTENA,APROBADO", lot.getQualityStickers());
        assertEquals(Lot.APROBADO, lot.getQualityStatus());
    }

    @Test
    void soloAmarillo_quedaEnCuarentena() {
        Lot lot = new Lot();
        LotService.applyQuality(lot, List.of("CUARENTENA"), null);

        assertEquals(Lot.CUARENTENA, lot.getQualityStatus());
    }

    @Test
    void rechazadoManda() {
        Lot lot = new Lot();
        LotService.applyQuality(lot, List.of("CUARENTENA", "RECHAZADO"), null);

        assertEquals(Lot.RECHAZADO, lot.getQualityStatus());
    }

    @Test
    void sinPuntos_sinEstado() {
        Lot lot = new Lot();
        LotService.applyQuality(lot, List.of(), null);

        assertNull(lot.getQualityStatus());
        assertNull(lot.getQualityStickers());
    }

    @Test
    void compatibleConUnSoloEstado() {
        Lot lot = new Lot();
        LotService.applyQuality(lot, null, "APROBADO");

        assertEquals("APROBADO", lot.getQualityStickers());
        assertEquals(Lot.APROBADO, lot.getQualityStatus());
    }
}
