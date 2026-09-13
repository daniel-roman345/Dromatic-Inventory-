package com.dromatic.inventory.service;

import com.dromatic.inventory.dto.LocationRequest;
import com.dromatic.inventory.dto.LocationResponse;
import com.dromatic.inventory.exception.BusinessException;
import com.dromatic.inventory.exception.ResourceNotFoundException;
import com.dromatic.inventory.model.Location;
import com.dromatic.inventory.repository.LocationRepository;
import com.dromatic.inventory.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
public class LocationService {

    private final LocationRepository locationRepository;
    private final ProductRepository productRepository;

    @Transactional(readOnly = true)
    public List<LocationResponse> findAll() {
        return locationRepository.findAll(Sort.by("zone", "aisle", "shelf", "level"))
                .stream().map(this::toResponse).toList();
    }

    @Transactional
    public LocationResponse create(LocationRequest request) {
        Location location = Location.builder()
                .zone(request.getZone().trim())
                .aisle(request.getAisle().trim())
                .shelf(request.getShelf().trim())
                .level(request.getLevel().trim())
                .build();
        return toResponse(locationRepository.save(location));
    }

    @Transactional
    public LocationResponse update(Long id, LocationRequest request) {
        Location location = locationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ubicación no encontrada."));
        location.setZone(request.getZone().trim());
        location.setAisle(request.getAisle().trim());
        location.setShelf(request.getShelf().trim());
        location.setLevel(request.getLevel().trim());
        return toResponse(locationRepository.save(location));
    }

    @Transactional
    public void delete(Long id) {
        if (!locationRepository.existsById(id)) {
            throw new ResourceNotFoundException("Ubicación no encontrada.");
        }
        if (productRepository.existsByLocationId(id)) {
            throw new BusinessException("No se puede eliminar la ubicación porque tiene productos asignados.");
        }
        locationRepository.deleteById(id);
    }

    private LocationResponse toResponse(Location location) {
        return new LocationResponse(location.getId(), location.getZone(), location.getAisle(),
                location.getShelf(), location.getLevel());
    }
}
