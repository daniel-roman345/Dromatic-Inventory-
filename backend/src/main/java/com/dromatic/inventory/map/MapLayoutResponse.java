package com.dromatic.inventory.map;

import java.util.List;

/**
 * Todo lo necesario para dibujar un mapa: el área, las referencias (puertas,
 * oficina...) y las secciones con sus estanterías y lo que hay en cada piso.
 */
public record MapLayoutResponse(Area area, List<Landmark> landmarks, List<Section> sections) {

    public record Area(Long id, String code, String name, String description, int gridWidth, int gridHeight) {
    }

    public record Landmark(Long id, String kind, String label, int x, int y, int width, int height) {
    }

    public record Section(Long id, String code, String name, String kind, Long moduleId, String moduleCode,
                          String moduleName, String color, int x, int y, String orientation, boolean doubleSided,
                          String notes, List<RackView> racks) {
    }

    /** Estantería con la ocupación de cada piso (piso 1 = el de abajo). */
    public record RackView(Long id, String code, int levels, int position, String notes, List<LevelView> levelStats) {
    }

    /**
     * @param lots       rótulos guardados en el piso
     * @param items      artículos diferentes
     * @param unverified rótulos cargados desde los videos pendientes de verificar
     */
    public record LevelView(int level, String label, String locationCode, long lots, long items, long unverified) {
    }
}
