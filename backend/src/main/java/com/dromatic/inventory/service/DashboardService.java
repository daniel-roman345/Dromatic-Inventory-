package com.dromatic.inventory.service;

import com.dromatic.inventory.dto.DashboardResponse;
import com.dromatic.inventory.model.Movement;
import com.dromatic.inventory.repository.MovementRepository;
import com.dromatic.inventory.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final ProductRepository productRepository;
    private final MovementRepository movementRepository;
    private final MovementService movementService;

    public DashboardResponse getSummary() {
        long totalProducts = productRepository.count();
        long totalUnits = productRepository.findAll().stream()
                .mapToLong(p -> p.getQuantity() == null ? 0 : p.getQuantity())
                .sum();
        long lowStockCount = productRepository.findLowStockProducts().size();

        List<Movement> recent = movementRepository.findAll().stream()
                .sorted(Comparator.comparing(Movement::getCreatedAt).reversed())
                .limit(5)
                .toList();

        return DashboardResponse.builder()
                .totalProducts(totalProducts)
                .totalUnits(totalUnits)
                .lowStockCount(lowStockCount)
                .recentMovements(recent.stream().map(movementService::toResponse).toList())
                .build();
    }
}
