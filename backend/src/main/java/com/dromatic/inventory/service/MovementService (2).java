package com.dromatic.inventory.service;

import com.dromatic.inventory.dto.MovementRequest;
import com.dromatic.inventory.dto.MovementResponse;
import com.dromatic.inventory.exception.InsufficientStockException;
import com.dromatic.inventory.exception.ResourceNotFoundException;
import com.dromatic.inventory.model.*;
import com.dromatic.inventory.repository.MovementRepository;
import com.dromatic.inventory.repository.ProductRepository;
import com.dromatic.inventory.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MovementService {

    private final MovementRepository movementRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    public List<MovementResponse> findAll() {
        return movementRepository.findAll().stream().map(this::toResponse).toList();
    }

    public List<MovementResponse> findByFilters(Long productId, LocalDate start, LocalDate end, MovementType type) {
        List<Movement> movements;

        if (productId != null && start != null && end != null) {
            movements = movementRepository.findByProductIdAndMovementDateBetween(productId, start, end);
        } else if (start != null && end != null) {
            movements = movementRepository.findByMovementDateBetween(start, end);
        } else if (productId != null) {
            movements = movementRepository.findByProductId(productId);
        } else if (type != null) {
            movements = movementRepository.findByType(type);
        } else {
            movements = movementRepository.findAll();
        }

        if (type != null) {
            movements = movements.stream().filter(m -> m.getType() == type).toList();
        }

        return movements.stream().map(this::toResponse).toList();
    }

    public MovementResponse registerEntry(MovementRequest request, String username) {
        Product product = getProduct(request.getProductId());
        User user = getUser(username);

        product.setQuantity(product.getQuantity() + request.getQuantity());
        productRepository.save(product);

        Movement movement = buildMovement(product, user, MovementType.ENTRADA, request);
        return toResponse(movementRepository.save(movement));
    }

    public MovementResponse registerExit(MovementRequest request, String username) {
        Product product = getProduct(request.getProductId());
        User user = getUser(username);

        if (request.getQuantity() > product.getQuantity()) {
            throw new InsufficientStockException("Stock insuficiente para realizar la salida.");
        }

        product.setQuantity(product.getQuantity() - request.getQuantity());
        productRepository.save(product);

        Movement movement = buildMovement(product, user, MovementType.SALIDA, request);
        return toResponse(movementRepository.save(movement));
    }

    private Movement buildMovement(Product product, User user, MovementType type, MovementRequest request) {
        return Movement.builder()
                .product(product)
                .user(user)
                .type(type)
                .quantity(request.getQuantity())
                .movementDate(request.getMovementDate() != null ? request.getMovementDate() : LocalDate.now())
                .reason(request.getReason())
                .observation(request.getObservation())
                .build();
    }

    private Product getProduct(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("No se encontraron productos."));
    }

    private User getUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado."));
    }

    protected MovementResponse toResponse(Movement m) {
        return MovementResponse.builder()
                .id(m.getId())
                .productCode(m.getProduct().getCode())
                .productName(m.getProduct().getName())
                .type(m.getType().name())
                .quantity(m.getQuantity())
                .movementDate(m.getMovementDate())
                .reason(m.getReason())
                .observation(m.getObservation())
                .username(m.getUser().getUsername())
                .build();
    }
}
