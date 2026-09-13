package com.dromatic.inventory.service;

import com.dromatic.inventory.dto.MovementItemRequest;
import com.dromatic.inventory.dto.MovementRequest;
import com.dromatic.inventory.dto.MovementResponse;
import com.dromatic.inventory.exception.BusinessException;
import com.dromatic.inventory.exception.InsufficientStockException;
import com.dromatic.inventory.exception.ResourceNotFoundException;
import com.dromatic.inventory.model.*;
import com.dromatic.inventory.repository.MovementRepository;
import com.dromatic.inventory.repository.ProductRepository;
import com.dromatic.inventory.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class MovementService {

    private final MovementRepository movementRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<MovementResponse> search(Long productId, LocalDate start, LocalDate end, MovementType type) {
        if (start != null && end != null && start.isAfter(end)) {
            throw new BusinessException("La fecha inicial no puede ser mayor que la fecha final.");
        }
        return movementRepository.search(productId, type, start, end).stream().map(this::toResponse).toList();
    }

    /**
     * Registra una entrada o salida con uno o varios productos.
     * Todo se guarda en una sola transacción: si un producto falla (ej. stock insuficiente) no se guarda nada.
     */
    @Transactional
    public List<MovementResponse> register(MovementType type, MovementRequest request, String username) {
        String reason = request.getReason().trim();
        if (!MovementReasons.forType(type).contains(reason)) {
            throw new BusinessException("El motivo seleccionado no es válido.");
        }

        LocalDate date = request.getMovementDate() != null ? request.getMovementDate() : LocalDate.now();
        if (date.isAfter(LocalDate.now())) {
            throw new BusinessException("La fecha no puede ser futura.");
        }

        User user = getUser(username);

        // Si el mismo producto se agregó varias veces, se suman sus cantidades.
        Map<Long, Integer> quantities = new LinkedHashMap<>();
        for (MovementItemRequest item : request.getItems()) {
            quantities.merge(item.getProductId(), item.getQuantity(), Integer::sum);
        }

        List<Movement> saved = new ArrayList<>();
        for (Map.Entry<Long, Integer> entry : quantities.entrySet()) {
            Product product = productRepository.findByIdForUpdate(entry.getKey())
                    .orElseThrow(() -> new ResourceNotFoundException("Uno de los productos seleccionados no existe."));
            int quantity = entry.getValue();

            if (product.getStatus() == ProductStatus.INACTIVO) {
                throw new BusinessException("El producto " + label(product) + " está inactivo.");
            }

            if (type == MovementType.SALIDA) {
                if (quantity > product.getQuantity()) {
                    throw new InsufficientStockException("Stock insuficiente para " + label(product)
                            + ": disponible " + product.getQuantity() + ", solicitado " + quantity + ".");
                }
                product.setQuantity(product.getQuantity() - quantity);
            } else {
                product.setQuantity(product.getQuantity() + quantity);
            }

            saved.add(movementRepository.save(Movement.builder()
                    .product(product)
                    .user(user)
                    .type(type)
                    .quantity(quantity)
                    .movementDate(date)
                    .reason(reason)
                    .reference(blankToNull(request.getReference()))
                    .observation(blankToNull(request.getObservation()))
                    .build()));
        }

        return saved.stream().map(this::toResponse).toList();
    }

    /** Anula un movimiento: revierte su efecto en el stock y lo deja marcado en el historial (no se borra). */
    @Transactional
    public MovementResponse voidMovement(Long id, String voidReason, String username) {
        Movement movement = movementRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("El movimiento no existe."));

        if (Boolean.TRUE.equals(movement.getVoided())) {
            throw new BusinessException("El movimiento ya fue anulado.");
        }

        Product product = productRepository.findByIdForUpdate(movement.getProduct().getId())
                .orElseThrow(() -> new ResourceNotFoundException("El producto del movimiento no existe."));

        if (movement.getType() == MovementType.ENTRADA) {
            if (product.getQuantity() < movement.getQuantity()) {
                throw new InsufficientStockException("No se puede anular la entrada: el stock actual de "
                        + label(product) + " (" + product.getQuantity() + ") es menor que la cantidad de la entrada ("
                        + movement.getQuantity() + ").");
            }
            product.setQuantity(product.getQuantity() - movement.getQuantity());
        } else {
            product.setQuantity(product.getQuantity() + movement.getQuantity());
        }

        movement.setVoided(true);
        movement.setVoidedAt(LocalDateTime.now());
        movement.setVoidedBy(getUser(username));
        movement.setVoidReason(voidReason.trim());

        return toResponse(movementRepository.save(movement));
    }

    private User getUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado."));
    }

    private static String label(Product product) {
        return product.getCode() + " - " + product.getName();
    }

    private static String blankToNull(String value) {
        return (value == null || value.isBlank()) ? null : value.trim();
    }

    MovementResponse toResponse(Movement m) {
        return MovementResponse.builder()
                .id(m.getId())
                .productId(m.getProduct().getId())
                .productCode(m.getProduct().getCode())
                .productName(m.getProduct().getName())
                .type(m.getType().name())
                .quantity(m.getQuantity())
                .movementDate(m.getMovementDate())
                .createdAt(m.getCreatedAt())
                .reason(m.getReason())
                .reference(m.getReference())
                .observation(m.getObservation())
                .username(m.getUser().getUsername())
                .voided(Boolean.TRUE.equals(m.getVoided()))
                .voidedAt(m.getVoidedAt())
                .voidedBy(m.getVoidedBy() != null ? m.getVoidedBy().getUsername() : null)
                .voidReason(m.getVoidReason())
                .build();
    }
}
