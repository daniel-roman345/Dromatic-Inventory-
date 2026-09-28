package com.dromatic.inventory.map;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Mapas para consulta (todos los roles). */
@RestController
@RequestMapping("/api/maps")
@RequiredArgsConstructor
public class MapController {

    private final MapService mapService;

    @GetMapping
    public List<MapAreaSummary> areas() {
        return mapService.areas();
    }

    @GetMapping("/{areaCode}")
    public MapLayoutResponse layout(@PathVariable String areaCode) {
        return mapService.layout(areaCode);
    }
}
