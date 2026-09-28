package com.dromatic.inventory.user;

public record RoleResponse(Long id, String code, String name, String description) {

    public static RoleResponse from(Role r) {
        return new RoleResponse(r.getId(), r.getCode(), r.getName(), r.getDescription());
    }
}
