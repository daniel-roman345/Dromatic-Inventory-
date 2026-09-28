package com.dromatic.inventory.common.event;

/**
 * Se publica cada vez que cambia la cantidad de un artículo. Las alertas de
 * stock bajo lo escuchan después de que la transacción se confirma.
 */
public record StockChangedEvent(Long itemId) {
}
