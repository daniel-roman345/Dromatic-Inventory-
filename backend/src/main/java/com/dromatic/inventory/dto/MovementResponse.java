package com.dromatic.inventory.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter @Builder @AllArgsConstructor
public class MovementResponse {
    private Long id;
    private Long productId;
    private String productCode;
    private String productName;
    private String type;
    private Integer quantity;
    private LocalDate movementDate;
    private LocalDateTime createdAt;
    private String reason;
    private String reference;
    private String observation;
    private String username;
    private boolean voided;
    private LocalDateTime voidedAt;
    private String voidedBy;
    private String voidReason;
}
