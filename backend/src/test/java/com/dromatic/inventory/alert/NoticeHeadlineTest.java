package com.dromatic.inventory.alert;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;

/** Novedad que se escribe sola en el aviso de WhatsApp cuando el usuario no escribe una. */
class NoticeHeadlineTest {

    @Test
    void sinExistencias_esProductoAgotado() {
        assertEquals("Producto agotado", NoticeService.autoHeadline(BigDecimal.ZERO, new BigDecimal("100")));
    }

    @Test
    void enElMinimoOPorDebajo_esStockBajo() {
        assertEquals("Stock bajo", NoticeService.autoHeadline(new BigDecimal("100"), new BigDecimal("100")));
        assertEquals("Stock bajo", NoticeService.autoHeadline(new BigDecimal("40"), new BigDecimal("100")));
    }

    @Test
    void porEncimaDelMinimoOSinMinimo_esEstadoDelInventario() {
        assertEquals("Estado del inventario", NoticeService.autoHeadline(new BigDecimal("101"), new BigDecimal("100")));
        assertEquals("Estado del inventario", NoticeService.autoHeadline(new BigDecimal("5"), BigDecimal.ZERO));
    }
}
