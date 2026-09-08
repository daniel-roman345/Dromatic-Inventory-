package com.dromatic.inventory.service;

import com.dromatic.inventory.dto.LocationRequest;
import com.dromatic.inventory.dto.LocationResponse;
import com.dromatic.inventory.exception.ResourceNotFoundException;
import com.dromatic.inventory.model.Location;
import com.dromatic.inventory.repository.LocationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class LocationService {

    private final LocationRepository locationRepository;

    public List<LocationResponse> findAll() {
        return locationRepository.findAll().stream().map(this::toResponse).toList();
    }

    public LocationResponse create(LocationRequest request) {
        Location location = Location.builder()
                .zone(request.getZone())
                .aisle(request.getAisle())
                .shelf(request.getShelf())
                .level(request.getLevel())
                .build();
        return toResponse(locationRepository.save(location));
    }

    public LocationResponse update(Long id, LocationRequest request) {
        Location location = locationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ubicación no encontrada."));
        location.setZone(request.getZone());
        location.setAisle(request.getAisle());
        location.setShelf(request.getShelf());
        location.setLevel(request.getLevel());
        return toResponse(locationRepository.save(location));
    }

    public void delete(Long id) {
        if (!locationRepository.existsById(id)) {
            throw new ResourceNotFoundException("Ubicación no encontrada.");
        }
        locationRepository.deleteById(id);
    }

    private LocationResponse toResponse(Location location) {
        return new LocationResponse(location.getId(), location.getZone(), location.getAisle(),
                location.getShelf(), location.getLevel());
    }
}
