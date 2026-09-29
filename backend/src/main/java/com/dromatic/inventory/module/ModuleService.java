package com.dromatic.inventory.module;

import com.dromatic.inventory.common.exception.ResourceNotFoundException;
import com.dromatic.inventory.security.CurrentUserService;
import com.dromatic.inventory.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ModuleService {

    private final InventoryModuleRepository moduleRepository;
    private final ModulePermissionService permissionService;
    private final CurrentUserService currentUserService;

    @Transactional(readOnly = true)
    public List<ModuleResponse> findAll() {
        User user = currentUserService.currentUser();
        return moduleRepository.findByActiveTrueOrderBySortOrderAsc().stream()
                .map(m -> toResponse(m, user)).toList();
    }

    @Transactional(readOnly = true)
    public InventoryModule getByCode(String code) {
        return moduleRepository.findByCode(code)
                .orElseThrow(() -> new ResourceNotFoundException("El módulo " + code + " no existe."));
    }

    @Transactional(readOnly = true)
    public InventoryModule getById(Long id) {
        return moduleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("El módulo no existe."));
    }

    public ModuleResponse toResponse(InventoryModule m, User user) {
        return new ModuleResponse(m.getId(), m.getCode(), m.getName(), m.getDescription(), m.getDefaultUnit(),
                m.getDefaultMaterial(), m.getDefaultContainer(), Boolean.TRUE.equals(m.getTracksWeight()), m.getLocationHint(),
                m.getColor(), m.getIcon(), permissionService.canEdit(user, m));
    }
}
