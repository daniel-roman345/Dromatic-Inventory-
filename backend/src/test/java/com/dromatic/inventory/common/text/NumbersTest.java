package com.dromatic.inventory.common.text;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;

class NumbersTest {

    @Test
    void usaPuntoDeMilesYComaDecimal() {
        assertEquals("12.500", Numbers.format(new BigDecimal("12500.000")));
        assertEquals("3,5", Numbers.format(new BigDecimal("3.500")));
        assertEquals("0", Numbers.format(BigDecimal.ZERO));
    }
}
