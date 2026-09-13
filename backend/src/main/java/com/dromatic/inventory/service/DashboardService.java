package com.dromatic.inventory.service;

import com.dromatic.inventory.dto.DashboardResponse;
import com.dromatic.inventory.model.MovementType;
import com.dromatic.inventory.model.ProductStatus;
import com.dromatic.inventory.repository.MovementRepository;
import com.dromatic.inventory.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final ProductRepository productRepository;
    private final MovementRepository movementRepository;
    private final ProductService productService;
    private final MovementService movementService;

    @Transactional(readOnly = true)
    public DashboardResponse getSummary() {
        LocalDate today = LocalDate.now();
        LocalDate firstDayOfMonth = today.withDayOfMonth(1);

        return DashboardResponse.builder()
                .totalProducts(productRepository.countByStatus(ProductStatus.ACTIVO))
                .totalUnits(productRepository.sumActiveQuantity())
                .lowStockCount(productRepository.countLowStock())
                .entriesToday(movementRepository.sumQuantity(MovementType.ENTRADA, today, today))
                .exitsToday(movementRepository.sumQuantity(MovementType.SALIDA, today, today))
                .entriesMonth(movementRepository.sumQuantity(MovementType.ENTRADA, firstDayOfMonth, today))
                .exitsMonth(movementRepository.sumQuantity(MovementType.SALIDA, firstDayOfMonth, today))
                .lowStockProducts(productRepository.findLowStockProducts().stream()
                        .limit(5).map(productService::toResponse).toList())
                .recentMovements(movementRepository.findTop8ByOrderByCreatedAtDescIdDesc().stream()
                        .map(movementService::toResponse).toList())
                .build();
    }
}
