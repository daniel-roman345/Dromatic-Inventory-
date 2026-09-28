package com.dromatic.inventory;

import com.dromatic.inventory.config.AppProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

/**
 * Dromatic Inventory System (DIS) — inventario multi-módulo de Laboratorios Dromatic.
 *
 * <p>Organización del código por funcionalidad:
 * <ul>
 *   <li>{@code auth}, {@code user}, {@code security}: inicio de sesión, usuarios, roles y JWT.</li>
 *   <li>{@code module}: módulos de inventario (potes, tapas, etiquetas, materias primas) y permisos.</li>
 *   <li>{@code map}: mapas de las áreas (secciones, estanterías y pisos).</li>
 *   <li>{@code item}: catálogo de artículos e imágenes delantera/trasera.</li>
 *   <li>{@code lot}: rótulos de identificación (lotes) y existencias por ubicación.</li>
 *   <li>{@code movement}: entradas, salidas, traslados, ajustes y anulaciones.</li>
 *   <li>{@code alert}: alertas de stock bajo por correo y mensajes de WhatsApp.</li>
 *   <li>{@code report}, {@code dashboard}, {@code locate}: reportes PDF, resumen y búsqueda de ubicación.</li>
 * </ul>
 */
@SpringBootApplication
@EnableConfigurationProperties(AppProperties.class)
public class DromaticInventoryApplication {

    public static void main(String[] args) {
        SpringApplication.run(DromaticInventoryApplication.class, args);
    }
}
