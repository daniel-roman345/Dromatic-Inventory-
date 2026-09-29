package com.dromatic.inventory.map;

import com.dromatic.inventory.common.exception.BusinessException;
import com.dromatic.inventory.common.exception.DuplicateResourceException;
import com.dromatic.inventory.common.exception.ResourceNotFoundException;
import com.dromatic.inventory.map.MapAdminRequests.AreaRequest;
import com.dromatic.inventory.map.MapAdminRequests.LandmarkRequest;
import com.dromatic.inventory.map.MapAdminRequests.PerimeterRequest;
import com.dromatic.inventory.map.MapAdminRequests.RackRequest;
import com.dromatic.inventory.map.MapAdminRequests.SectionRequest;
import com.dromatic.inventory.module.ModuleService;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Editor de mapas: el administrador corrige lo marcado "por confirmar", agrega
 * pasillos nuevos o crea mapas para módulos futuros, sin tocar el código.
 * Nunca se pierde mercancía: no se puede borrar ni recortar un piso que tenga existencias.
 */
@Service
@RequiredArgsConstructor
public class MapAdminService {

    private final MapAreaRepository areaRepository;
    private final MapSectionRepository sectionRepository;
    private final RackRepository rackRepository;
    private final MapLandmarkRepository landmarkRepository;
    private final ModuleService moduleService;
    private final MapService mapService;
    private final NamedParameterJdbcTemplate jdbc;

    // ─── Áreas ──────────────────────────────────────────────────────────

    @Transactional
    public MapLayoutResponse createArea(AreaRequest request) {
        String code = request.code().trim().toUpperCase(Locale.ROOT);
        if (areaRepository.existsByCode(code)) {
            throw new DuplicateResourceException("Ya existe un mapa con el código " + code + ".");
        }
        MapArea area = areaRepository.save(MapArea.builder()
                .code(code)
                .name(request.name().trim())
                .description(blankToNull(request.description()))
                .gridWidth(request.gridWidth())
                .gridHeight(request.gridHeight())
                .levelLabel(levelLabelOrDefault(request.levelLabel()))
                .levelsFromTop(Boolean.TRUE.equals(request.levelsFromTop()))
                .sortOrder((int) areaRepository.count() + 1)
                .build());
        return mapService.layout(area.getCode());
    }

    @Transactional
    public MapLayoutResponse updateArea(Long id, AreaRequest request) {
        MapArea area = area(id);
        area.setName(request.name().trim());
        area.setDescription(blankToNull(request.description()));
        area.setGridWidth(request.gridWidth());
        area.setGridHeight(request.gridHeight());
        area.setLevelLabel(levelLabelOrDefault(request.levelLabel()));
        area.setLevelsFromTop(Boolean.TRUE.equals(request.levelsFromTop()));
        return mapService.layout(area.getCode());
    }

    // ─── Secciones (pasillos, muros, zonas) ─────────────────────────────

    @Transactional
    public MapLayoutResponse createSection(Long areaId, SectionRequest request) {
        MapArea area = area(areaId);
        String code = request.code().trim().toUpperCase(Locale.ROOT);
        if (sectionRepository.existsByAreaIdAndCode(areaId, code)) {
            throw new DuplicateResourceException("Ya existe la sección " + code + " en " + area.getName() + ".");
        }
        MapSection section = MapSection.builder().area(area).code(code).build();
        applySection(section, area, request);
        section.setSortOrder(sectionRepository.findByAreaWithModule(areaId).size() + 1);
        sectionRepository.save(section);
        int count = request.rackCount() == null ? 0 : request.rackCount();
        if (count > 0) {
            int levels = request.rackLevels() == null ? 3 : request.rackLevels();
            int length = request.rackLength() == null ? 1 : request.rackLength();
            List<Integer> lengths = new ArrayList<>();
            for (int i = 0; i < count; i++) {
                lengths.add(length);
            }
            for (List<MapGeometry.Cell> cells : MapGeometry.rackCells(section.getMapX(), section.getMapY(),
                    section.getOrientation(), Boolean.TRUE.equals(section.getReversed()), lengths)) {
                for (MapGeometry.Cell c : cells) {
                    if (!MapGeometry.inside(c, area.getGridWidth(), area.getGridHeight())) {
                        throw new BusinessException("Las " + count + " estanterías no caben en esa dirección: se salen del mapa. "
                                + "Ponga menos, cambie la dirección o agrande el mapa.");
                    }
                }
            }
            for (int i = 0; i < count; i++) {
                rackRepository.save(Rack.builder().section(section).code(RackCodes.sequence(request.startCode(), i))
                        .levels(levels).length(length).position(i + 1).build());
            }
        }
        return mapService.layout(area.getCode());
    }

    @Transactional
    public MapLayoutResponse updateSection(Long id, SectionRequest request) {
        MapSection section = section(id);
        MapArea area = section.getArea();
        String code = request.code().trim().toUpperCase(Locale.ROOT);
        if (sectionRepository.existsByAreaIdAndCodeAndIdNot(area.getId(), code, id)) {
            throw new DuplicateResourceException("Ya existe la sección " + code + " en " + area.getName() + ".");
        }
        section.setCode(code);
        applySection(section, area, request);
        return mapService.layout(area.getCode());
    }

    @Transactional
    public MapLayoutResponse deleteSection(Long id) {
        MapSection section = section(id);
        String areaCode = section.getArea().getCode();
        List<Rack> racks = rackRepository.findBySectionId(id);
        for (Rack rack : racks) {
            ensureEmpty(rack, 1);
        }
        if (racks.stream().anyMatch(this::hasHistory)) {
            throw new BusinessException("La sección tiene historial de movimientos y no se puede borrar para no perder "
                    + "la trazabilidad. Puede quitarle las estanterías: las que tienen historial quedan archivadas.");
        }
        rackRepository.deleteAll(racks);
        sectionRepository.delete(section);
        return mapService.layout(areaCode);
    }

    /**
     * "Igual al pasillo X": deja la sección con las mismas estanterías y la misma
     * cantidad de pisos que otra. No toca pisos que tengan mercancía.
     */
    @Transactional
    public MapLayoutResponse copyRacks(Long targetSectionId, Long sourceSectionId) {
        if (targetSectionId.equals(sourceSectionId)) {
            throw new BusinessException("Escoja una sección diferente para copiar.");
        }
        MapSection target = section(targetSectionId);
        section(sourceSectionId);
        List<Rack> source = rackRepository.findActiveBySection(sourceSectionId);
        Map<String, Rack> current = rackRepository.findActiveBySection(targetSectionId).stream()
                .collect(Collectors.toMap(Rack::getCode, Function.identity()));

        for (Rack model : source) {
            Rack existing = current.remove(model.getCode());
            if (existing == null) {
                Rack archived = rackRepository.findBySectionIdAndCode(targetSectionId, model.getCode()).orElse(null);
                if (archived != null) {
                    archived.setActive(true);
                    archived.setLevels(model.getLevels());
                    archived.setLength(model.getLength());
                    archived.setPosition(model.getPosition());
                } else {
                    rackRepository.save(Rack.builder().section(target).code(model.getCode())
                            .levels(model.getLevels()).length(model.getLength()).position(model.getPosition()).build());
                }
            } else {
                ensureEmpty(existing, model.getLevels() + 1);
                existing.setLevels(model.getLevels());
                existing.setLength(model.getLength());
                existing.setPosition(model.getPosition());
            }
        }
        // Las estanterías que sobran se quitan (o se archivan si tienen historial).
        for (Rack extra : current.values()) {
            removeRack(extra);
        }
        return mapService.layout(target.getArea().getCode());
    }

    // ─── Estanterías ────────────────────────────────────────────────────

    @Transactional
    public MapLayoutResponse createRack(Long sectionId, RackRequest request) {
        MapSection section = section(sectionId);
        String code = request.code().trim().toUpperCase(Locale.ROOT);
        Rack rack = rackRepository.findBySectionIdAndCode(sectionId, code).orElse(null);
        if (rack != null && Boolean.TRUE.equals(rack.getActive())) {
            throw new DuplicateResourceException("Ya existe la estantería " + code + " en " + section.getName() + ".");
        }
        if (rack == null) {
            rack = Rack.builder().section(section).code(code).build();
        }
        List<Rack> ordered = rackRepository.findActiveBySection(sectionId);
        int position = ordered.size() + 1;
        if (request.afterRackId() != null) {
            Rack after = ordered.stream().filter(r -> r.getId().equals(request.afterRackId())).findFirst()
                    .orElseThrow(() -> new BusinessException("La estantería de referencia no está en esta sección."));
            position = after.getPosition() + 1;
            // Las que siguen se corren un puesto; conservan su letra porque está marcada en la bodega.
            for (Rack next : ordered) {
                if (next.getPosition() >= position) {
                    next.setPosition(next.getPosition() + 1);
                }
            }
        }
        rack.setActive(true);
        rack.setLevels(request.levels());
        rack.setLength(request.length() == null ? 1 : request.length());
        rack.setNotes(blankToNull(request.notes()));
        rack.setPosition(position);
        rackRepository.save(rack);
        return mapService.layout(section.getArea().getCode());
    }

    /**
     * Agrega un piso a la estantería. Por defecto arriba (F3 → nuevo F4); si se
     * indica {@code at}, se inserta en esa altura y los pisos de encima suben uno.
     */
    @Transactional
    public MapLayoutResponse addLevel(Long rackId, Integer at) {
        Rack rack = rack(rackId);
        if (rack.getLevels() >= 20) {
            throw new BusinessException("La estantería " + rack.getCode() + " ya tiene el máximo de 20 pisos.");
        }
        int newLevel = at == null ? rack.getLevels() + 1 : at;
        if (newLevel < 1 || newLevel > rack.getLevels() + 1) {
            throw new BusinessException("El piso nuevo debe estar entre 1 y " + (rack.getLevels() + 1) + ".");
        }
        // La mercancía de los pisos de encima sube con su piso (el C2 pasa a ser C3).
        jdbc.update("UPDATE stock SET level = level + 1 WHERE rack_id = :rackId AND level >= :level",
                new MapSqlParameterSource("rackId", rackId).addValue("level", newLevel));
        rack.setLevels(rack.getLevels() + 1);
        return mapService.layout(rack.getSection().getArea().getCode());
    }

    /**
     * Quita un piso específico (ej. el F3). Debe estar vacío; los pisos de encima
     * bajan uno (el F4 pasa a ser F3), igual que en la estantería física.
     */
    @Transactional
    public MapLayoutResponse removeLevel(Long rackId, int level) {
        Rack rack = rack(rackId);
        if (level < 1 || level > rack.getLevels()) {
            throw new BusinessException("La estantería " + rack.getCode() + " no tiene el piso " + level + ".");
        }
        if (rack.getLevels() == 1) {
            throw new BusinessException("Es el único piso de la estantería " + rack.getCode()
                    + ". Si ya no existe, quite la estantería completa.");
        }
        Integer count = jdbc.queryForObject(
                "SELECT COUNT(*) FROM stock WHERE rack_id = :rackId AND level = :level AND quantity > 0",
                new MapSqlParameterSource("rackId", rackId).addValue("level", level), Integer.class);
        if (count != null && count > 0) {
            throw new BusinessException("El piso " + rack.levelLabel(level)
                    + " tiene mercancía. Primero trasládela a otra ubicación.");
        }
        var params = new MapSqlParameterSource("rackId", rackId).addValue("level", level);
        jdbc.update("DELETE FROM stock WHERE rack_id = :rackId AND level = :level AND quantity = 0", params);
        jdbc.update("UPDATE stock SET level = level - 1 WHERE rack_id = :rackId AND level > :level", params);
        rack.setLevels(rack.getLevels() - 1);
        return mapService.layout(rack.getSection().getArea().getCode());
    }

    @Transactional
    public MapLayoutResponse updateRack(Long id, RackRequest request) {
        Rack rack = rack(id);
        String code = request.code().trim().toUpperCase(Locale.ROOT);
        if (!code.equals(rack.getCode())) {
            rackRepository.findBySectionIdAndCode(rack.getSection().getId(), code).ifPresent(other -> {
                throw new DuplicateResourceException("Ya existe la estantería " + code + " en esta sección.");
            });
            rack.setCode(code);
        }
        if (request.levels() < rack.getLevels()) {
            ensureEmpty(rack, request.levels() + 1);
        }
        rack.setLevels(request.levels());
        if (request.length() != null) {
            rack.setLength(request.length());
        }
        rack.setNotes(blankToNull(request.notes()));
        return mapService.layout(rack.getSection().getArea().getCode());
    }

    @Transactional
    public MapLayoutResponse deleteRack(Long id) {
        Rack rack = rack(id);
        String areaCode = rack.getSection().getArea().getCode();
        removeRack(rack);
        return mapService.layout(areaCode);
    }

    /**
     * Rodea el cuarto con un muro de estanterías, en el sentido de las agujas del
     * reloj desde la esquina de arriba a la izquierda. Cada tramo libre del borde
     * queda como una sección y las letras siguen de un tramo al otro.
     */
    @Transactional
    public MapLayoutResponse perimeterWall(Long areaId, PerimeterRequest request) {
        MapArea area = area(areaId);
        int w = area.getGridWidth();
        int h = area.getGridHeight();
        Set<MapGeometry.Cell> busy = occupiedCells(area);
        int levels = request.levels() == null ? 3 : request.levels();
        String baseName = request.name() == null || request.name().isBlank() ? "Muro" : request.name().trim();
        var module = request.moduleId() == null ? null : moduleService.getById(request.moduleId());
        int letter = 0;
        int created = 0;
        int order = sectionRepository.findByAreaWithModule(areaId).size();

        // Lados en el sentido del reloj: nombre, celdas en orden de recorrido, orientación y sentido
        List<Side> sides = new ArrayList<>();
        if (!Boolean.FALSE.equals(request.top())) {
            sides.add(new Side("arriba", line(0, 0, 1, 0, w), "H", false));
        }
        if (!Boolean.FALSE.equals(request.right())) {
            sides.add(new Side("derecha", line(w - 1, 1, 0, 1, h - 1), "V", false));
        }
        if (!Boolean.FALSE.equals(request.bottom())) {
            sides.add(new Side("abajo", line(w - 2, h - 1, -1, 0, w - 1), "H", true));
        }
        if (!Boolean.FALSE.equals(request.left())) {
            sides.add(new Side("izquierda", line(0, h - 2, 0, -1, h - 2), "V", true));
        }

        for (Side side : sides) {
            List<List<MapGeometry.Cell>> runs = new ArrayList<>();
            List<MapGeometry.Cell> run = new ArrayList<>();
            for (MapGeometry.Cell c : side.cells()) {
                if (busy.contains(c)) {
                    if (!run.isEmpty()) {
                        runs.add(run);
                        run = new ArrayList<>();
                    }
                } else {
                    run.add(c);
                }
            }
            if (!run.isEmpty()) {
                runs.add(run);
            }
            for (int r = 0; r < runs.size(); r++) {
                List<MapGeometry.Cell> segment = runs.get(r);
                MapGeometry.Cell start = segment.get(0);
                MapSection section = sectionRepository.save(MapSection.builder()
                        .area(area)
                        .code(freeSectionCode(areaId))
                        .name(baseName + " · " + side.name() + (runs.size() > 1 ? " " + (r + 1) : ""))
                        .kind(MapSection.MURO)
                        .module(module)
                        .mapX(start.x())
                        .mapY(start.y())
                        .orientation(side.orientation())
                        .reversed(side.reversed())
                        .sortOrder(++order)
                        .build());
                for (int i = 0; i < segment.size(); i++) {
                    rackRepository.save(Rack.builder().section(section)
                            .code(RackCodes.sequence(request.startCode(), letter++))
                            .levels(levels).position(i + 1).build());
                    busy.add(segment.get(i));
                    created++;
                }
            }
        }
        if (created == 0) {
            throw new BusinessException("El borde del cuarto ya está ocupado: no quedó espacio libre para el muro.");
        }
        return mapService.layout(area.getCode());
    }

    private record Side(String name, List<MapGeometry.Cell> cells, String orientation, boolean reversed) {
    }

    // ─── Referencias (puertas, oficina, escaleras...) ───────────────────

    @Transactional
    public MapLayoutResponse createLandmark(Long areaId, LandmarkRequest request) {
        MapArea area = area(areaId);
        MapLandmark landmark = MapLandmark.builder().area(area).build();
        applyLandmark(landmark, area, request);
        landmarkRepository.save(landmark);
        return mapService.layout(area.getCode());
    }

    @Transactional
    public MapLayoutResponse updateLandmark(Long id, LandmarkRequest request) {
        MapLandmark landmark = landmarkRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("La referencia no existe."));
        applyLandmark(landmark, landmark.getArea(), request);
        return mapService.layout(landmark.getArea().getCode());
    }

    @Transactional
    public MapLayoutResponse deleteLandmark(Long id) {
        MapLandmark landmark = landmarkRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("La referencia no existe."));
        String areaCode = landmark.getArea().getCode();
        landmarkRepository.delete(landmark);
        return mapService.layout(areaCode);
    }

    // ─── Ayudas ─────────────────────────────────────────────────────────

    private void applySection(MapSection section, MapArea area, SectionRequest request) {
        requireInside(area, request.x(), request.y(), 1, 1);
        section.setName(request.name().trim());
        section.setKind(request.kind());
        section.setModule(request.moduleId() == null ? null : moduleService.getById(request.moduleId()));
        section.setMapX(request.x());
        section.setMapY(request.y());
        section.setOrientation(request.orientation() == null ? "H" : request.orientation());
        section.setReversed(Boolean.TRUE.equals(request.reversed()));
        section.setDoubleSided(Boolean.TRUE.equals(request.doubleSided()));
        section.setNotes(blankToNull(request.notes()));
    }

    private void applyLandmark(MapLandmark landmark, MapArea area, LandmarkRequest request) {
        requireInside(area, request.x(), request.y(), request.width(), request.height());
        landmark.setKind(request.kind());
        landmark.setLabel(request.label() == null || request.label().isBlank() ? defaultLabel(request.kind()) : request.label().trim());
        landmark.setMapX(request.x());
        landmark.setMapY(request.y());
        landmark.setWidth(request.width());
        landmark.setHeight(request.height());
    }

    private static void requireInside(MapArea area, int x, int y, int width, int height) {
        if (x + width > area.getGridWidth() || y + height > area.getGridHeight()) {
            throw new BusinessException("La posición queda por fuera del mapa (" + area.getGridWidth() + " columnas × "
                    + area.getGridHeight() + " filas). Agrande el mapa o escoja otra posición.");
        }
    }

    /** Quita la estantería; si tiene historial solo se archiva para no perder la trazabilidad. */
    private void removeRack(Rack rack) {
        ensureEmpty(rack, 1);
        if (hasHistory(rack)) {
            rack.setActive(false);
        } else {
            rackRepository.delete(rack);
        }
    }

    /** Falla si hay mercancía desde el piso indicado hacia arriba. */
    private void ensureEmpty(Rack rack, int fromLevel) {
        Integer count = jdbc.queryForObject(
                "SELECT COUNT(*) FROM stock WHERE rack_id = :rackId AND level >= :fromLevel AND quantity > 0",
                new MapSqlParameterSource("rackId", rack.getId()).addValue("fromLevel", fromLevel), Integer.class);
        if (count != null && count > 0) {
            throw new BusinessException("La estantería " + rack.getCode() + " tiene mercancía en "
                    + (fromLevel <= 1 ? "sus pisos" : "los pisos desde el " + fromLevel)
                    + ". Primero traslade esa mercancía a otra ubicación.");
        }
    }

    private boolean hasHistory(Rack rack) {
        Integer count = jdbc.queryForObject("""
                        SELECT (SELECT COUNT(*) FROM movements WHERE from_rack_id = :id OR to_rack_id = :id)
                             + (SELECT COUNT(*) FROM stock WHERE rack_id = :id)""",
                new MapSqlParameterSource("id", rack.getId()), Integer.class);
        return count != null && count > 0;
    }

    private MapArea area(Long id) {
        return areaRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("El mapa no existe."));
    }

    private MapSection section(Long id) {
        return sectionRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("La sección no existe."));
    }

    private Rack rack(Long id) {
        return rackRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("La estantería no existe."));
    }

    /** Celdas del borde, desde (x, y) avanzando (dx, dy), n celdas. */
    private static List<MapGeometry.Cell> line(int x, int y, int dx, int dy, int n) {
        List<MapGeometry.Cell> cells = new ArrayList<>();
        for (int i = 0; i < n; i++) {
            cells.add(new MapGeometry.Cell(x + dx * i, y + dy * i));
        }
        return cells;
    }

    /** Celdas ocupadas por estanterías y referencias (menos los textos sueltos). */
    private Set<MapGeometry.Cell> occupiedCells(MapArea area) {
        Set<MapGeometry.Cell> busy = new HashSet<>();
        for (MapLandmark l : landmarkRepository.findByAreaIdOrderByIdAsc(area.getId())) {
            if ("TEXTO".equals(l.getKind())) {
                continue;
            }
            for (int dx = 0; dx < l.getWidth(); dx++) {
                for (int dy = 0; dy < l.getHeight(); dy++) {
                    busy.add(new MapGeometry.Cell(l.getMapX() + dx, l.getMapY() + dy));
                }
            }
        }
        for (MapSection s : sectionRepository.findByAreaWithModule(area.getId())) {
            List<Integer> lengths = rackRepository.findActiveBySection(s.getId()).stream().map(Rack::getLength).toList();
            MapGeometry.rackCells(s.getMapX(), s.getMapY(), s.getOrientation(), Boolean.TRUE.equals(s.getReversed()), lengths)
                    .forEach(busy::addAll);
        }
        return busy;
    }

    /** Código libre para una sección nueva de muro: M1, M2, M3… */
    private String freeSectionCode(Long areaId) {
        for (int i = 1; ; i++) {
            String code = "M" + i;
            if (!sectionRepository.existsByAreaIdAndCode(areaId, code)) {
                return code;
            }
        }
    }

    private static String defaultLabel(String kind) {
        return switch (kind) {
            case "PARED" -> "Pared";
            case "PUERTA" -> "Puerta";
            case "OFICINA" -> "Oficina";
            case "ESCALERA" -> "Escalera";
            case "PASILLO" -> "Pasillo";
            case "MAQUINA" -> "Máquina";
            case "MALACATE" -> "Malacate";
            default -> "Referencia";
        };
    }

    private static String levelLabelOrDefault(String label) {
        String value = blankToNull(label);
        return value == null ? "Piso" : value;
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
