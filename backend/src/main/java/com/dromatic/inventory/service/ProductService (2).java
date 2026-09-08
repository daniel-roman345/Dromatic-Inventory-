package com.dromatic.inventory.service;

import com.dromatic.inventory.dto.ProductRequest;
import com.dromatic.inventory.dto.ProductResponse;
import com.dromatic.inventory.exception.DuplicateResourceException;
import com.dromatic.inventory.exception.ResourceNotFoundException;
import com.dromatic.inventory.model.Location;
import com.dromatic.inventory.model.Product;
import com.dromatic.inventory.model.ProductStatus;
import com.dromatic.inventory.repository.LocationRepository;
import com.dromatic.inventory.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final LocationRepository locationRepository;

    public List<ProductResponse> findAll() {
        return productRepository.findAll().stream().map(this::toResponse).toList();
    }

    public ProductResponse findById(Long id) {
        return toResponse(getProductOrThrow(id));
    }

    public List<ProductResponse> search(String name) {
        return productRepository.findByNameContainingIgnoreCase(name).stream().map(this::toResponse).toList();
    }

    public List<ProductResponse> findLowStock() {
        return productRepository.findLowStockProducts().stream().map(this::toResponse).toList();
    }

    public ProductResponse create(ProductRequest request) {
        if (productRepository.existsByCode(request.getCode())) {
            throw new DuplicateResourceException("El código del producto ya existe.");
        }

        Location location = locationRepository.findById(request.getLocationId())
                .orElseThrow(() -> new ResourceNotFoundException("Ubicación no encontrada."));

        Product product = Product.builder()
                .code(request.getCode())
                .name(request.getName())
                .description(request.getDescription())
                .quantity(request.getQuantity())
                .minimumStock(request.getMinimumStock())
                .location(location)
                .entryDate(request.getEntryDate() != null ? request.getEntryDate() : LocalDate.now())
                .status(request.getStatus() != null ? ProductStatus.valueOf(request.getStatus()) : ProductStatus.ACTIVO)
                .build();

        return toResponse(productRepository.save(product));
    }

    public ProductResponse update(Long id, ProductRequest request) {
        Product product = getProductOrThrow(id);

        if (!product.getCode().equals(request.getCode()) && productRepository.existsByCode(request.getCode())) {
            throw new DuplicateResourceException("El código del producto ya existe.");
        }

        Location location = locationRepository.findById(request.getLocationId())
                .orElseThrow(() -> new ResourceNotFoundException("Ubicación no encontrada."));

        product.setCode(request.getCode());
        product.setName(request.getName());
        product.setDescription(request.getDescription());
        product.setQuantity(request.getQuantity());
        product.setMinimumStock(request.getMinimumStock());
        product.setLocation(location);
        if (request.getEntryDate() != null) product.setEntryDate(request.getEntryDate());
        if (request.getStatus() != null) product.setStatus(ProductStatus.valueOf(request.getStatus()));

        return toResponse(productRepository.save(product));
    }

    public void delete(Long id) {
        Product product = getProductOrThrow(id);
        productRepository.delete(product);
    }

    protected Product getProductOrThrow(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("No se encontraron productos."));
    }

    protected ProductResponse toResponse(Product p) {
        return ProductResponse.builder()
                .id(p.getId())
                .code(p.getCode())
                .name(p.getName())
                .description(p.getDescription())
                .quantity(p.getQuantity())
                .minimumStock(p.getMinimumStock())
                .locationId(p.getLocation().getId())
                .locationLabel(p.getLocation().getFullLabel())
                .entryDate(p.getEntryDate())
                .status(p.getStatus().name())
                .lowStock(p.isLowStock())
                .build();
    }
}
