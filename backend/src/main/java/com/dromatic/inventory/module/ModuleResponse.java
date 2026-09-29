package com.dromatic.inventory.module;

/**
 * Módulo con la información que la interfaz necesita para dibujarse.
 *
 * @param defaultUnit     unidad propuesta para artículos nuevos (se puede cambiar)
 * @param defaultMaterial tipo de material propuesto en el rótulo (se puede cambiar)
 * @param defaultContainer contenedor propuesto al contar (canasta, rollo...), o NULL
 * @param tracksWeight    el formulario muestra el peso desde el inicio
 * @param canEdit         si el usuario actual puede modificar este módulo
 */
public record ModuleResponse(
        Long id,
        String code,
        String name,
        String description,
        String defaultUnit,
        String defaultMaterial,
        String defaultContainer,
        boolean tracksWeight,
        String locationHint,
        String color,
        String icon,
        boolean canEdit) {
}
