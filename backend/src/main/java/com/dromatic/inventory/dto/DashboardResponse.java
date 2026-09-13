package com.dromatic.inventory.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import java.util.List;

@Getter @Builder @AllArgsConstructor
public class DashboardResponse {
    private long totalProducts;
    private long totalUnits;
    private long lowStockCount;
    private long entriesToday;
    private long exitsToday;
    private long entriesMonth;
    private long exitsMonth;
    private List<ProductResponse> lowStockProducts;
    private List<MovementResponse> recentMovements;
}
