package com.dromatic.inventory.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import java.time.LocalDate;

@Getter @Builder @AllArgsConstructor
public class MovementResponse {
    private Long id;
    private String productCode;
    private String productName;
    private String type;
    private Integer quantity;
    private LocalDate movementDate;
    private String reason;
    private String observation;
    private String username;
}
