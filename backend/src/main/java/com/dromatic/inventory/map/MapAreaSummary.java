package com.dromatic.inventory.map;

public record MapAreaSummary(Long id, String code, String name, String description, long racks, long occupiedLevels) {
}
