package com.dromatic.inventory.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;

/**
 * Habilita tareas en segundo plano. Se usa para enviar correos de alerta sin
 * hacer esperar al usuario que registró el movimiento.
 */
@Configuration
@EnableAsync
public class AsyncConfig {
}
