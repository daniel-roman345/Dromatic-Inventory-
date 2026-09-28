package com.dromatic.inventory.movement;

import com.dromatic.inventory.item.ItemRequest;
import com.dromatic.inventory.lot.LabelRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Formularios de movimientos. Todo lo que no tiene opciones fijas se escribe
 * libre: tipo de movimiento, motivo, contenedor, unidades, peso y nota.
 */
public final class MovementRequests {

    private MovementRequests() {
    }

    /**
     * Cantidad escrita como número total, o como contenedores × unidades
     * (ej. 15 cajas × 350). Si se escriben las dos, manda el total.
     */
    public record QuantityInput(
            @DecimalMin(value = "0.001", message = "La cantidad debe ser mayor que cero.")
            @DecimalMax(value = "10000000", message = "La cantidad es demasiado grande.") BigDecimal total,
            @DecimalMin(value = "0.001", message = "La cantidad de contenedores debe ser mayor que cero.")
            @DecimalMax(value = "1000000", message = "Son demasiados contenedores.") BigDecimal containers,
            @Size(max = 40) String containerName,
            @DecimalMin(value = "0.001", message = "Las unidades por contenedor deben ser mayores que cero.")
            @DecimalMax(value = "10000000", message = "Son demasiadas unidades por contenedor.") BigDecimal unitsPerContainer,
            @DecimalMin(value = "0", message = "El peso no puede ser negativo.")
            @DecimalMax(value = "10000000", message = "El peso es demasiado grande.") BigDecimal weightKg) {
    }

    /** Estantería y piso del mapa, o una ubicación escrita (para módulos sin mapa). */
    public record LocationInput(Long rackId, Integer level, @Size(max = 120) String note) {
    }

    /**
     * Entrada: artículo existente o nuevo, rótulo existente o nuevo, cantidad y ubicación.
     *
     * @param lotId   sumar a un rótulo que ya existe (NULL = rótulo nuevo con {@code label})
     * @param newItem crear el artículo en el momento si todavía no existe
     */
    public record EntryRequest(
            Long itemId,
            @Valid ItemRequest newItem,
            Long lotId,
            @Valid LabelRequest label,
            @NotNull(message = "Escriba la cantidad.") @Valid QuantityInput quantity,
            @Valid LocationInput location,
            @Size(max = 60) String movementType,
            @Size(max = 120) String reason,
            @Size(max = 500) String note,
            @Size(max = 60) String reference,
            @PastOrPresent(message = "La fecha no puede ser futura.") LocalDate movementDate) {
    }

    /** Salida de uno o varios rótulos a la vez (ej. todo lo que se lleva producción). */
    public record ExitRequest(
            @NotEmpty(message = "Escoja al menos un rótulo.") @Valid List<ExitLine> lines,
            @Size(max = 60) String movementType,
            @Size(max = 120) String reason,
            @Size(max = 500) String note,
            @Size(max = 60) String reference,
            @PastOrPresent(message = "La fecha no puede ser futura.") LocalDate movementDate) {
    }

    public record ExitLine(
            @NotNull(message = "Escoja el rótulo y la ubicación.") Long stockId,
            @NotNull(message = "Escriba la cantidad.") @Valid QuantityInput quantity) {
    }

    /** Traslado: sin cantidad se mueve todo lo que hay en esa ubicación. */
    public record TransferRequest(
            @NotNull(message = "Escoja qué va a trasladar.") Long stockId,
            @Valid QuantityInput quantity,
            @NotNull(message = "Escoja a dónde lo va a trasladar.") @Valid LocationInput to,
            @Size(max = 60) String movementType,
            @Size(max = 120) String reason,
            @Size(max = 500) String note,
            @PastOrPresent(message = "La fecha no puede ser futura.") LocalDate movementDate) {
    }

    /** Ajuste: se escribe lo que se contó físicamente y el sistema calcula la diferencia. */
    public record AdjustRequest(
            @NotNull(message = "Escoja qué va a ajustar.") Long stockId,
            @NotNull(message = "Escriba la cantidad contada.")
            @DecimalMin(value = "0", message = "La cantidad contada no puede ser negativa.")
            @DecimalMax(value = "10000000", message = "La cantidad es demasiado grande.") BigDecimal countedQuantity,
            @DecimalMin(value = "0", message = "El peso no puede ser negativo.") BigDecimal countedWeightKg,
            @Size(max = 60) String movementType,
            @Size(max = 120) String reason,
            @Size(max = 500) String note,
            @PastOrPresent(message = "La fecha no puede ser futura.") LocalDate movementDate) {
    }

    public record VoidRequest(
            @NotBlank(message = "Escriba por qué se anula el movimiento.") @Size(max = 255) String reason) {
    }
}
