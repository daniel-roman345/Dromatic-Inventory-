package com.dromatic.inventory.auth;

/** Token de sesión y datos del usuario que inició sesión. */
public record LoginResponse(String token, long expiresInMs, MeResponse user) {
}
