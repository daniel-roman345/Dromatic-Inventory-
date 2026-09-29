package com.dromatic.inventory.map;

import java.util.List;

/**
 * Todo lo necesario para dibujar un mapa: el área, las referencias (puertas,
 * oficina...) y las secciones con sus estanterías y lo que hay en cada piso.
 */
public record MapLayoutResponse(Area area, List<Landmark> landmarks, List<Section> sections) {

    /**
     * @param levelLabel    "Piso" o "Fila"
     * @param levelsFromTop TRUE si el nivel 1 es el de arriba
     */
    public record Area(Long id, String code, String name, String description, int gridWidth, int gridHeight,
                       String levelLabel, boolean levelsFromTop) {
    }

    public record Landmark(Long id, String kind, String label, int x, int y, int width, int height) {
    }

    /** @param reversed sentido del tramo: en H de derecha a izquierda, en V de abajo hacia arriba */
    public record Section(Long id, String code, String name, String kind, Long moduleId, String moduleCode,
                          String moduleName, String color, int x, int y, String orientation, boolean reversed,
                          boolean doubleSided, String notes, List<RackView> racks) {
    }

    /**
     * Estantería con la ocupación de cada piso o fila.
     *
     * @param length largo en celdas del mapa
     */
    public record RackView(Long id, String code, int levels, int length, int position, String notes,
                           List<LevelView> levelStats) {
    }

    /**
     * @param lots       rótulos guardados en el piso
     * @param items      artículos diferentes
     * @param unverified rótulos cargados desde los videos pendientes de verificar
     */
    public record LevelView(int level, String label, String locationCode, long lots, long items, long unverified) {
    }
}
