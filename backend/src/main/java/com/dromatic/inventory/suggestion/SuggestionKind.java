package com.dromatic.inventory.suggestion;

/**
 * Campos de texto libre que tienen autocompletar. Cada tipo sabe de dónde sacar
 * lo que ya se ha escrito antes, para sugerir primero lo más usado.
 * {@code :moduleId} puede ser NULL (todos los módulos).
 */
public enum SuggestionKind {

    CONTENEDOR(true, """
            SELECT m.container_name FROM movements m JOIN items i ON i.id = m.item_id
            WHERE m.container_name IS NOT NULL AND (:moduleId IS NULL OR i.module_id = :moduleId)
            GROUP BY m.container_name ORDER BY COUNT(*) DESC LIMIT 20"""),

    UNIDAD(true, """
            SELECT unit_name FROM items WHERE (:moduleId IS NULL OR module_id = :moduleId)
            GROUP BY unit_name ORDER BY COUNT(*) DESC LIMIT 20"""),

    TIPO_MATERIAL(true, """
            SELECT l.material_type FROM lots l JOIN items i ON i.id = l.item_id
            WHERE (:moduleId IS NULL OR i.module_id = :moduleId)
            GROUP BY l.material_type ORDER BY COUNT(*) DESC LIMIT 20"""),

    TIPO_ENTRADA(true, movementTypeSql("ENTRADA")),
    TIPO_SALIDA(true, movementTypeSql("SALIDA")),
    TIPO_TRASLADO(true, movementTypeSql("TRASLADO")),
    TIPO_AJUSTE(true, movementTypeSql("AJUSTE")),

    MOTIVO_ENTRADA(true, reasonSql("ENTRADA")),
    MOTIVO_SALIDA(true, reasonSql("SALIDA")),
    MOTIVO_TRASLADO(true, reasonSql("TRASLADO")),
    MOTIVO_AJUSTE(true, reasonSql("AJUSTE")),

    /** Solo historial: proveedores escritos en rótulos anteriores. */
    PROVEEDOR(false, """
            SELECT l.supplier FROM lots l JOIN items i ON i.id = l.item_id
            WHERE l.supplier IS NOT NULL AND (:moduleId IS NULL OR i.module_id = :moduleId)
            GROUP BY l.supplier ORDER BY COUNT(*) DESC LIMIT 20"""),

    /** Solo historial: responsables escritos en rótulos anteriores (de cualquier módulo). */
    RESPONSABLE(false, """
            SELECT l.responsible FROM lots l WHERE l.responsible IS NOT NULL
            GROUP BY l.responsible ORDER BY COUNT(*) DESC LIMIT 20""");

    /** Si el administrador puede agregar valores base de este tipo. */
    private final boolean editable;
    private final String historySql;

    SuggestionKind(boolean editable, String historySql) {
        this.editable = editable;
        this.historySql = historySql;
    }

    public boolean isEditable() {
        return editable;
    }

    public String historySql() {
        return historySql;
    }

    private static String movementTypeSql(String effect) {
        return """
                SELECT m.movement_type FROM movements m JOIN items i ON i.id = m.item_id
                WHERE m.effect = '%s' AND m.voided = FALSE AND (:moduleId IS NULL OR i.module_id = :moduleId)
                GROUP BY m.movement_type ORDER BY COUNT(*) DESC LIMIT 20""".formatted(effect);
    }

    private static String reasonSql(String effect) {
        return """
                SELECT m.reason FROM movements m JOIN items i ON i.id = m.item_id
                WHERE m.effect = '%s' AND m.reason IS NOT NULL AND (:moduleId IS NULL OR i.module_id = :moduleId)
                GROUP BY m.reason ORDER BY COUNT(*) DESC LIMIT 20""".formatted(effect);
    }
}
