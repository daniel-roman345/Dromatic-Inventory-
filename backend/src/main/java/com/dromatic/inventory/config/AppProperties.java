package com.dromatic.inventory.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Configuración propia de la aplicación (prefijo {@code app.*} en application.properties).
 *
 * @param company   datos de la empresa para reportes, correos y mensajes de WhatsApp
 * @param publicUrl dirección con la que los usuarios abren el sistema (enlaces en correos)
 * @param mail      remitente de los correos de alerta
 */
@ConfigurationProperties(prefix = "app")
public record AppProperties(Company company, String publicUrl, Mail mail) {

    public record Company(String name, String address, String phone) {
    }

    public record Mail(String from) {
    }
}
