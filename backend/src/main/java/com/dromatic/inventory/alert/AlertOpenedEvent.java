package com.dromatic.inventory.alert;

/** Se abrió una alerta nueva: hay que avisar por correo. */
public record AlertOpenedEvent(Long alertId) {
}
