/**
 * Mapas interactivos vistos desde arriba.
 * <pre>
 *   MapArea 1──* MapSection 1──* Rack        (Rack.levels = cantidad de pisos)
 *   MapArea 1──* MapLandmark                 (puertas, oficina, escaleras...)
 * </pre>
 * Una ubicación es una estantería más un piso: en la Bodega 1, pasillo 4,
 * estantería C, piso 2 → código {@code B1-P4-C2}. Las coordenadas son celdas
 * de una cuadrícula que el frontend dibuja en SVG; el administrador las edita
 * sin programar.
 */
package com.dromatic.inventory.map;
