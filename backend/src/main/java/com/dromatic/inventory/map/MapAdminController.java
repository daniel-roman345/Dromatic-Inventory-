package com.dromatic.inventory.map;

import com.dromatic.inventory.map.MapAdminRequests.AreaRequest;
import com.dromatic.inventory.map.MapAdminRequests.DuplicateRequest;
import com.dromatic.inventory.map.MapAdminRequests.GrowRequest;
import com.dromatic.inventory.map.MapAdminRequests.LandmarkRequest;
import com.dromatic.inventory.map.MapAdminRequests.PerimeterRequest;
import com.dromatic.inventory.map.MapAdminRequests.RackRequest;
import com.dromatic.inventory.map.MapAdminRequests.SectionRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/** Editor de mapas. Solo el administrador (ver SecurityConfig: /api/admin/**). Cada cambio devuelve el mapa actualizado. */
@RestController
@RequestMapping("/api/admin/maps")
@RequiredArgsConstructor
public class MapAdminController {

    private final MapAdminService service;

    @PostMapping("/areas")
    public MapLayoutResponse createArea(@Valid @RequestBody AreaRequest request) {
        return service.createArea(request);
    }

    @PutMapping("/areas/{id}")
    public MapLayoutResponse updateArea(@PathVariable Long id, @Valid @RequestBody AreaRequest request) {
        return service.updateArea(id, request);
    }

    /** Agrandar o achicar el mapa por cualquier lado (lo dibujado se corre solo). */
    @PostMapping("/areas/{id}/grow")
    public MapLayoutResponse growArea(@PathVariable Long id, @Valid @RequestBody GrowRequest request) {
        return service.growArea(id, request);
    }

    /** Eliminar un mapa (se archiva si tiene historial). */
    @DeleteMapping("/areas/{id}")
    public MapAdminService.DeleteResult deleteArea(@PathVariable Long id) {
        return service.deleteArea(id);
    }

    /** Copiar un pasillo con sus estanterías en otra posición. */
    @PostMapping("/sections/{id}/duplicate")
    public MapLayoutResponse duplicateSection(@PathVariable Long id, @Valid @RequestBody DuplicateRequest request) {
        return service.duplicateSection(id, request);
    }

    /** Rodea el cuarto con un muro de estanterías; las letras siguen de un tramo al otro. */
    @PostMapping("/areas/{areaId}/perimeter")
    public MapLayoutResponse perimeterWall(@PathVariable Long areaId, @Valid @RequestBody PerimeterRequest request) {
        return service.perimeterWall(areaId, request);
    }

    @PostMapping("/areas/{areaId}/sections")
    public MapLayoutResponse createSection(@PathVariable Long areaId, @Valid @RequestBody SectionRequest request) {
        return service.createSection(areaId, request);
    }

    @PutMapping("/sections/{id}")
    public MapLayoutResponse updateSection(@PathVariable Long id, @Valid @RequestBody SectionRequest request) {
        return service.updateSection(id, request);
    }

    @DeleteMapping("/sections/{id}")
    public MapLayoutResponse deleteSection(@PathVariable Long id) {
        return service.deleteSection(id);
    }

    /** "Igual al pasillo X": copia estanterías y pisos de otra sección. */
    @PostMapping("/sections/{id}/copy-from/{sourceId}")
    public MapLayoutResponse copyRacks(@PathVariable Long id, @PathVariable Long sourceId) {
        return service.copyRacks(id, sourceId);
    }

    @PostMapping("/sections/{sectionId}/racks")
    public MapLayoutResponse createRack(@PathVariable Long sectionId, @Valid @RequestBody RackRequest request) {
        return service.createRack(sectionId, request);
    }

    @PutMapping("/racks/{id}")
    public MapLayoutResponse updateRack(@PathVariable Long id, @Valid @RequestBody RackRequest request) {
        return service.updateRack(id, request);
    }

    @DeleteMapping("/racks/{id}")
    public MapLayoutResponse deleteRack(@PathVariable Long id) {
        return service.deleteRack(id);
    }

    /** Agrega un piso arriba, o en la altura {@code at} corriendo los de encima. */
    @PostMapping("/racks/{id}/levels")
    public MapLayoutResponse addLevel(@PathVariable Long id, @RequestParam(required = false) Integer at) {
        return service.addLevel(id, at);
    }

    /** Quita un piso específico (ej. F3) si está vacío; los de encima bajan uno. */
    @DeleteMapping("/racks/{id}/levels/{level}")
    public MapLayoutResponse removeLevel(@PathVariable Long id, @PathVariable int level) {
        return service.removeLevel(id, level);
    }

    @PostMapping("/areas/{areaId}/landmarks")
    public MapLayoutResponse createLandmark(@PathVariable Long areaId, @Valid @RequestBody LandmarkRequest request) {
        return service.createLandmark(areaId, request);
    }

    @PutMapping("/landmarks/{id}")
    public MapLayoutResponse updateLandmark(@PathVariable Long id, @Valid @RequestBody LandmarkRequest request) {
        return service.updateLandmark(id, request);
    }

    @DeleteMapping("/landmarks/{id}")
    public MapLayoutResponse deleteLandmark(@PathVariable Long id) {
        return service.deleteLandmark(id);
    }
}
