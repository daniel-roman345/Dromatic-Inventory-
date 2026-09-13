package com.dromatic.inventory.service;

import com.dromatic.inventory.dto.ProductRequest;
import com.dromatic.inventory.dto.ProductResponse;
import com.dromatic.inventory.exception.BusinessException;
import com.dromatic.inventory.exception.DuplicateResourceException;
import com.dromatic.inventory.exception.ResourceNotFoundException;
import com.dromatic.inventory.model.*;
import com.dromatic.inventory.repository.LocationRepository;
import com.dromatic.inventory.repository.MovementRepository;
import com.dromatic.inventory.repository.ProductRepository;
import com.dromatic.inventory.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final LocationRepository locationRepository;
    private final MovementRepository movementRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<ProductResponse> search(String query, ProductStatus status) {
        String q = (query == null || query.isBlank()) ? null : query.trim();
        return productRepository.search(q, status).stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<ProductResponse> findLowStock() {
        return productRepository.findLowStockProducts().stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public ProductResponse findById(Long id) {
        return toResponse(getProductOrThrow(id));
    }

    /**
     * Registra un producto. Si trae cantidad inicial se guarda también como movimiento
     * de ENTRADA ("Inventario inicial") para conservar la trazabilidad del stock.
     */
    @Transactional
    public ProductResponse create(ProductRequest request, String username) {
        String code = request.getCode().trim().toUpperCase();
        if (productRepository.existsByCode(code)) {
            throw new DuplicateResourceException("Ya existe un producto con el código " + code + ".");
        }

        int initialQuantity = request.getQuantity() == null ? 0 : request.getQuantity();
        LocalDate entryDate = request.getEntryDate() != null ? request.getEntryDate() : LocalDate.now();

        Product product = productRepository.save(Product.builder()
                .code(code)
                .name(request.getName().trim())
                .description(blankToNull(request.getDescription()))
                .quantity(initialQuantity)
                .minimumStock(request.getMinimumStock())
                .location(getLocation(request.getLocationId()))
                .entryDate(entryDate)
                .status(request.getStatus() != null ? ProductStatus.valueOf(request.getStatus()) : ProductStatus.ACTIVO)
                .build());

        if (initialQuantity > 0) {
            User user = userRepository.findByUsername(username)
                    .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado."));
            movementRepository.save(Movement.builder()
                    .product(product)
                    .user(user)
                    .type(MovementType.ENTRADA)
                    .quantity(initialQuantity)
                    .movementDate(entryDate)
                    .reason(MovementReasons.INITIAL_STOCK)
                    .build());
        }

        return toResponse(product);
    }

    /** Actualiza los datos del producto. La cantidad NO se modifica aquí: solo cambia con entradas y salidas. */
    @Transactional
    public ProductResponse update(Long id, ProductRequest request) {
        Product product = getProductOrThrow(id);
        String code = request.getCode().trim().toUpperCase();

        if (!product.getCode().equalsIgnoreCase(code) && productRepository.existsByCode(code)) {
            throw new DuplicateResourceException("Ya existe un producto con el código " + code + ".");
        }

        product.setCode(code);
        product.setName(request.getName().trim());
        product.setDescription(blankToNull(request.getDescription()));
        product.setMinimumStock(request.getMinimumStock());
        product.setLocation(getLocation(request.getLocationId()));
        if (request.getEntryDate() != null) product.setEntryDate(request.getEntryDate());
        if (request.getStatus() != null) product.setStatus(ProductStatus.valueOf(request.getStatus()));

        return toResponse(productRepository.save(product));
    }

    @Transactional
    public void delete(Long id) {
        Product product = getProductOrThrow(id);
        if (movementRepository.existsByProductId(id)) {
            throw new BusinessException("No se puede eliminar " + product.getCode()
                    + " porque tiene movimientos en el historial. Puede marcarlo como INACTIVO.");
        }
        productRepository.delete(product);
    }

    private Product getProductOrThrow(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("El producto no existe."));
    }

    private Location getLocation(Long id) {
        return locationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("La ubicación seleccionada no existe."));
    }

    private static String blankToNull(String value) {
        return (value == null || value.isBlank()) ? null : value.trim();
    }

    ProductResponse toResponse(Product p) {
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
