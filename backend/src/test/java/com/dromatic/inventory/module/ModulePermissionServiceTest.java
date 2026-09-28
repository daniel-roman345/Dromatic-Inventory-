package com.dromatic.inventory.module;

import com.dromatic.inventory.common.exception.ForbiddenOperationException;
import com.dromatic.inventory.user.Role;
import com.dromatic.inventory.user.User;
import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

class ModulePermissionServiceTest {

    private final ModulePermissionService service = new ModulePermissionService();

    private final Role admin = role(1L, Role.ADMIN);
    private final Role jefe = role(2L, Role.JEFE);
    private final Role bodega = role(3L, Role.BODEGA);
    private final Role produccion = role(4L, Role.PRODUCCION);

    private final InventoryModule potes = module("POTES", bodega);
    private final InventoryModule materiasPrimas = module("MATERIAS_PRIMAS", produccion);

    @Test
    void administradorModificaTodo() {
        assertTrue(service.canEdit(user(admin), potes));
        assertTrue(service.canEdit(user(admin), materiasPrimas));
    }

    @Test
    void bodegaModificaPotesYSoloConsultaMateriasPrimas() {
        assertTrue(service.canEdit(user(bodega), potes));
        assertFalse(service.canEdit(user(bodega), materiasPrimas));
    }

    @Test
    void produccionModificaSoloMateriasPrimas() {
        assertTrue(service.canEdit(user(produccion), materiasPrimas));
        assertFalse(service.canEdit(user(produccion), potes));
    }

    @Test
    void jefeSoloConsulta_yElMensajeLoExplica() {
        assertFalse(service.canEdit(user(jefe), potes));
        ForbiddenOperationException e = assertThrows(ForbiddenOperationException.class,
                () -> service.requireEdit(user(jefe), potes));
        assertTrue(e.getMessage().contains("solo puede consultar el módulo POTES"), e.getMessage());
    }

    private static Role role(Long id, String code) {
        return Role.builder().id(id).code(code).name(code).build();
    }

    private static User user(Role role) {
        return User.builder().id(role.getId()).username(role.getCode().toLowerCase()).role(role).build();
    }

    private static InventoryModule module(String code, Role editor) {
        return InventoryModule.builder().code(code).name(code).editorRoles(Set.of(editor)).build();
    }
}
