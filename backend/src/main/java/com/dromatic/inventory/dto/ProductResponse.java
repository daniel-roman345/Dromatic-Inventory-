package com.dromatic.inventory.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import java.time.LocalDate;

@Getter @Builder @AllArgsConstructor
public class ProductResponse {
    private Long id;
    private String imageUrl;
    private String code;
    private String name;
    private String description;
    private Integer quantity;
    private Integer minimumStock;
    private Long locationId;
    private String locationLabel;
    private LocalDate entryDate;
    private String status;
    private boolean lowStock;
}
