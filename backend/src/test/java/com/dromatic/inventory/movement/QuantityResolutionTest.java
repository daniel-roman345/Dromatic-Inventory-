package com.dromatic.inventory.movement;

import com.dromatic.inventory.common.exception.BusinessException;
import com.dromatic.inventory.movement.MovementRequests.QuantityInput;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

/** Cantidades libres: número total o contenedores × unidades por contenedor. */
class QuantityResolutionTest {

    @Test
    void contenedoresPorUnidades() {
        var q = MovementService.resolve(new QuantityInput(null, bd("15"), " caja ", bd("350"), null));

        assertEquals(0, q.total().compareTo(bd("5250")));
        assertEquals("caja", q.containerName());
        assertEquals(0, q.unitsPerContainer().compareTo(bd("350")));
    }

    @Test
    void elTotalEscritoMandaSobreElCalculo() {
        // 3 canastas de 230, pero la última venía incompleta: se escribió 650.
        var q = MovementService.resolve(new QuantityInput(bd("650"), bd("3"), "canasta", bd("230"), null));

        assertEquals(0, q.total().compareTo(bd("650")));
    }

    @Test
    void admiteDecimalesParaKilos() {
        var q = MovementService.resolve(new QuantityInput(null, bd("2"), "bulto", bd("25.5"), null));

        assertEquals(0, q.total().compareTo(bd("51")));
    }

    @Test
    void conservaElPesoEscrito() {
        var q = MovementService.resolve(new QuantityInput(bd("5"), null, null, null, bd("250")));

        assertEquals(0, q.weightKg().compareTo(bd("250")));
    }

    @Test
    void sinCantidad_pideEscribirla() {
        BusinessException e = assertThrows(BusinessException.class,
                () -> MovementService.resolve(new QuantityInput(null, bd("2"), "canasta", null, null)));
        assertTrue(e.getMessage().startsWith("Escriba la cantidad"));
    }

    @Test
    void cantidadDemasiadoGrande_seRechaza() {
        assertThrows(BusinessException.class,
                () -> MovementService.resolve(new QuantityInput(null, bd("100000"), null, bd("1000"), null)));
    }

    private static BigDecimal bd(String value) {
        return new BigDecimal(value);
    }
}
