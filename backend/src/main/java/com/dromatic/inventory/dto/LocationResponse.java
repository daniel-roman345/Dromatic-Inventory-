package com.dromatic.inventory.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter @Builder @AllArgsConstructor
public class LocationResponse {
    private Long id;
    private String zone;
    private String aisle;
    private String shelf;
    private String level;
}
