package com.dromatic.inventory.module;

import com.dromatic.inventory.common.exception.ForbiddenOperationException;
import com.dromatic.inventory.user.User;
import org.springframework.stereotype.Service;

/**
 * Regla central de permisos: todos ven todo; modificar un módulo solo lo puede el
 * administrador o los roles configurados como editores del módulo.
 */
@Service
public class ModulePermissionService {

    public boolean canEdit(User user, InventoryModule module) {
        if (user == null || module == null) {
            return false;
        }
        if (user.isAdmin()) {
            return true;
        }
        return module.getEditorRoles().stream().anyMatch(r -> r.getId().equals(user.getRole().getId()));
    }

    public void requireEdit(User user, InventoryModule module) {
        if (!canEdit(user, module)) {
            throw new ForbiddenOperationException("Su rol (" + user.getRole().getName()
                    + ") solo puede consultar el módulo " + module.getName() + ".");
        }
    }
}
