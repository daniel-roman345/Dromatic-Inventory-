package com.dromatic.inventory.map;

import com.dromatic.inventory.common.exception.BusinessException;
import com.dromatic.inventory.common.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

/** Consulta de los mapas y validación de ubicaciones (estantería + piso). */
@Service
@RequiredArgsConstructor
public class MapService {

    private static final String OCCUPANCY_SQL = """
            SELECT s.rack_id, s.level,
                   COUNT(DISTINCT s.lot_id) AS lots,
                   COUNT(DISTINCT l.item_id) AS items,
                   COUNT(DISTINCT CASE WHEN l.verified = FALSE THEN l.id END) AS unverified
            FROM stock s
            JOIN lots l ON l.id = s.lot_id
            JOIN racks r ON r.id = s.rack_id
            JOIN map_sections ms ON ms.id = r.section_id
            WHERE ms.area_id = :areaId AND s.quantity > 0
            GROUP BY s.rack_id, s.level""";

    private final MapAreaRepository areaRepository;
    private final MapSectionRepository sectionRepository;
    private final RackRepository rackRepository;
    private final MapLandmarkRepository landmarkRepository;
    private final NamedParameterJdbcTemplate jdbc;

    @Transactional(readOnly = true)
    public List<MapAreaSummary> areas() {
        return areaRepository.findByActiveTrueOrderBySortOrderAsc().stream().map(a -> {
            var occupancy = occupancy(a.getId());
            long racks = rackRepository.findActiveByArea(a.getId()).size();
            return new MapAreaSummary(a.getId(), a.getCode(), a.getName(), a.getDescription(), racks, occupancy.size());
        }).toList();
    }

    @Transactional(readOnly = true)
    public MapLayoutResponse layout(String areaCode) {
        MapArea area = areaRepository.findByCode(areaCode.toUpperCase(Locale.ROOT))
                .orElseThrow(() -> new ResourceNotFoundException("El mapa " + areaCode + " no existe."));
        Map<String, long[]> occupancy = occupancy(area.getId());

        Map<Long, List<Rack>> racksBySection = new HashMap<>();
        for (Rack rack : rackRepository.findActiveByArea(area.getId())) {
            racksBySection.computeIfAbsent(rack.getSection().getId(), k -> new ArrayList<>()).add(rack);
        }

        List<MapLayoutResponse.Section> sections = sectionRepository.findByAreaWithModule(area.getId()).stream()
                .map(s -> new MapLayoutResponse.Section(s.getId(), s.getCode(), s.getName(), s.getKind(),
                        s.getModule() == null ? null : s.getModule().getId(),
                        s.getModule() == null ? null : s.getModule().getCode(),
                        s.getModule() == null ? null : s.getModule().getName(),
                        s.getModule() == null ? "gray" : s.getModule().getColor(),
                        s.getMapX(), s.getMapY(), s.getOrientation(), Boolean.TRUE.equals(s.getReversed()),
                        Boolean.TRUE.equals(s.getDoubleSided()),
                        s.getNotes(),
                        racksBySection.getOrDefault(s.getId(), List.of()).stream()
                                .map(r -> toRackView(area, s, r, occupancy)).toList()))
                .toList();

        List<MapLayoutResponse.Landmark> landmarks = landmarkRepository.findByAreaIdOrderByIdAsc(area.getId()).stream()
                .map(l -> new MapLayoutResponse.Landmark(l.getId(), l.getKind(), l.getLabel(), l.getMapX(), l.getMapY(),
                        l.getWidth(), l.getHeight()))
                .toList();

        return new MapLayoutResponse(new MapLayoutResponse.Area(area.getId(), area.getCode(), area.getName(),
                area.getDescription(), area.getGridWidth(), area.getGridHeight(), area.getLevelLabel(),
                Boolean.TRUE.equals(area.getLevelsFromTop())), landmarks, sections);
    }

    /**
     * Verifica que la estantería exista y que el piso esté dentro de sus pisos.
     * Devuelve la estantería con su sección y área cargadas.
     */
    @Transactional(readOnly = true)
    public Rack requireLocation(Long rackId, Integer level) {
        Rack rack = rackRepository.findWithLocation(rackId)
                .orElseThrow(() -> new ResourceNotFoundException("La estantería no existe."));
        if (!Boolean.TRUE.equals(rack.getActive())) {
            throw new BusinessException("La estantería " + rack.getCode() + " ya no está en uso.");
        }
        if (level == null || level < 1 || level > rack.getLevels()) {
            String unit = rack.getSection().getArea().getLevelLabel().toLowerCase(Locale.ROOT);
            throw new BusinessException("La estantería " + rack.getCode() + " tiene " + rack.getLevels() + " "
                    + (rack.getLevels() == 1 ? unit : unit + "s") + ". Escoja entre 1 y " + rack.getLevels() + ".");
        }
        return rack;
    }

    private MapLayoutResponse.RackView toRackView(MapArea area, MapSection section, Rack rack,
                                                  Map<String, long[]> occupancy) {
        List<MapLayoutResponse.LevelView> levels = new ArrayList<>();
        for (int level = 1; level <= rack.getLevels(); level++) {
            long[] stats = occupancy.getOrDefault(rack.getId() + ":" + level, new long[3]);
            levels.add(new MapLayoutResponse.LevelView(level, rack.getCode() + level,
                    area.getCode() + "-" + section.getCode() + "-" + rack.getCode() + level,
                    stats[0], stats[1], stats[2]));
        }
        return new MapLayoutResponse.RackView(rack.getId(), rack.getCode(), rack.getLevels(), rack.getLength(),
                rack.getPosition(), rack.getNotes(), levels);
    }

    /** Clave "rackId:piso" → [rótulos, artículos, por verificar]. */
    private Map<String, long[]> occupancy(Long areaId) {
        Map<String, long[]> result = new HashMap<>();
        jdbc.query(OCCUPANCY_SQL, new MapSqlParameterSource("areaId", areaId), rs -> {
            result.put(rs.getLong("rack_id") + ":" + rs.getInt("level"),
                    new long[]{rs.getLong("lots"), rs.getLong("items"), rs.getLong("unverified")});
        });
        return result;
    }
}
