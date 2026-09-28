package com.dromatic.inventory.common.text;

import java.math.BigDecimal;
import java.text.DecimalFormat;
import java.text.DecimalFormatSymbols;
import java.util.Locale;

/** Números como se escriben en Colombia: 12.500 y 3,5. */
public final class Numbers {

    private static final Locale ES_CO = Locale.forLanguageTag("es-CO");

    private Numbers() {
    }

    public static String format(BigDecimal value) {
        if (value == null) {
            return "";
        }
        DecimalFormat format = new DecimalFormat("#,##0.###", DecimalFormatSymbols.getInstance(ES_CO));
        return format.format(value);
    }
}
