package com.dromatic.inventory.item;

import com.dromatic.inventory.common.event.StockChangedEvent;
import com.dromatic.inventory.common.exception.BusinessException;
import com.dromatic.inventory.common.exception.DuplicateResourceException;
import com.dromatic.inventory.common.exception.ResourceNotFoundException;
import com.dromatic.inventory.lot.StockRepository;
import com.dromatic.inventory.module.InventoryModule;
import com.dromatic.inventory.module.ModulePermissionService;
import com.dromatic.inventory.module.ModuleService;
import com.dromatic.inventory.security.CurrentUserService;
import com.dromatic.inventory.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.util.Locale;
import java.util.Set;

/** Crear y corregir artículos, y sus imágenes delantera y trasera. */
@Service
@RequiredArgsConstructor
public class ItemService {

    private static final Set<String> IMAGE_TYPES = Set.of("image/jpeg", "image/png", "image/webp");
    private static final long MAX_IMAGE_BYTES = 6L * 1024 * 1024;

    private final ItemRepository itemRepository;
    private final ItemImageRepository imageRepository;
    private final StockRepository stockRepository;
    private final ModuleService moduleService;
    private final ModulePermissionService permissionService;
    private final CurrentUserService currentUserService;
    private final NamedParameterJdbcTemplate jdbc;
    private final ApplicationEventPublisher events;

    /**
     * Crea el artículo. Si ya existe uno con el mismo nombre y presentación en el
     * módulo se avisa, para no tener el mismo producto dos veces.
     */
    @Transactional
    public Item create(ItemRequest request) {
        InventoryModule module = moduleService.getById(request.moduleId());
        User user = currentUserService.currentUser();
        permissionService.requireEdit(user, module);

        String name = request.name().trim();
        String presentation = clean(request.presentation());
        itemRepository.findSame(module.getId(), name, presentation).ifPresent(existing -> {
            throw new DuplicateResourceException("Ya existe \"" + existing.displayName() + "\" en " + module.getName()
                    + ". Búsquelo en la lista en lugar de crearlo de nuevo.");
        });
        String code = cleanCode(request.code());
        if (code != null && itemRepository.existsByModuleIdAndCode(module.getId(), code)) {
            throw new DuplicateResourceException("Ya existe un artículo con el código " + code + " en " + module.getName() + ".");
        }
        Item item = Item.builder()
                .module(module)
                .name(name)
                .presentation(presentation)
                .code(code)
                .unitName(unitOrDefault(request.unitName(), module))
                .minimumStock(request.minimumStock() == null ? BigDecimal.ZERO : request.minimumStock())
                .description(clean(request.description()))
                .createdBy(user)
                .build();
        return itemRepository.save(item);
    }

    @Transactional
    public void update(Long id, ItemRequest request) {
        Item item = find(id);
        User user = currentUserService.currentUser();
        permissionService.requireEdit(user, item.getModule());
        if (!item.getModule().getId().equals(request.moduleId())) {
            throw new BusinessException("Un artículo no se puede pasar a otro módulo. Créelo en el módulo correcto.");
        }
        String name = request.name().trim();
        String presentation = clean(request.presentation());
        itemRepository.findSame(item.getModule().getId(), name, presentation)
                .filter(other -> !other.getId().equals(id))
                .ifPresent(other -> {
                    throw new DuplicateResourceException("Ya existe \"" + other.displayName() + "\" en este módulo.");
                });
        String code = cleanCode(request.code());
        if (code != null && itemRepository.existsByModuleIdAndCodeAndIdNot(item.getModule().getId(), code, id)) {
            throw new DuplicateResourceException("Ya existe un artículo con el código " + code + ".");
        }
        item.setName(name);
        item.setPresentation(presentation);
        item.setCode(code);
        item.setUnitName(unitOrDefault(request.unitName(), item.getModule()));
        item.setMinimumStock(request.minimumStock() == null ? BigDecimal.ZERO : request.minimumStock());
        item.setDescription(clean(request.description()));
        // Si cambió el mínimo, la alerta de stock bajo puede abrirse o cerrarse.
        events.publishEvent(new StockChangedEvent(id));
    }

    /** Un artículo solo se inactiva cuando ya no tiene existencias. */
    @Transactional
    public void setStatus(Long id, String status) {
        Item item = find(id);
        permissionService.requireEdit(currentUserService.currentUser(), item.getModule());
        String value = status.trim().toUpperCase(Locale.ROOT);
        if (!Item.ACTIVO.equals(value) && !Item.INACTIVO.equals(value)) {
            throw new BusinessException("El estado debe ser ACTIVO o INACTIVO.");
        }
        if (Item.INACTIVO.equals(value) && stockRepository.totalByItem(id).signum() > 0) {
            throw new BusinessException("El artículo todavía tiene existencias. Primero regístrelas como salida o ajuste.");
        }
        item.setStatus(value);
        events.publishEvent(new StockChangedEvent(id));
    }

    /** Solo se borra un artículo creado por error, que nunca tuvo rótulos. */
    @Transactional
    public void delete(Long id) {
        Item item = find(id);
        permissionService.requireEdit(currentUserService.currentUser(), item.getModule());
        Integer lots = jdbc.queryForObject("SELECT COUNT(*) FROM lots WHERE item_id = :id",
                new MapSqlParameterSource("id", id), Integer.class);
        if (lots != null && lots > 0) {
            throw new BusinessException("El artículo tiene historial. En lugar de borrarlo, márquelo como inactivo.");
        }
        jdbc.update("DELETE FROM stock_alerts WHERE item_id = :id", new MapSqlParameterSource("id", id));
        itemRepository.delete(item);
    }

    // ─── Imágenes ───────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public ItemImage image(Long itemId, String side) {
        return imageRepository.findByItemIdAndSide(itemId, normalizeSide(side))
                .orElseThrow(() -> new ResourceNotFoundException("El artículo no tiene esa imagen."));
    }

    @Transactional
    public void saveImage(Long itemId, String side, MultipartFile file) {
        Item item = find(itemId);
        User user = currentUserService.currentUser();
        permissionService.requireEdit(user, item.getModule());
        if (file == null || file.isEmpty()) {
            throw new BusinessException("Escoja una imagen.");
        }
        String contentType = file.getContentType() == null ? "" : file.getContentType().toLowerCase(Locale.ROOT);
        if (!IMAGE_TYPES.contains(contentType)) {
            throw new BusinessException("La imagen debe ser JPG, PNG o WEBP.");
        }
        if (file.getSize() > MAX_IMAGE_BYTES) {
            throw new BusinessException("La imagen es muy pesada. El máximo es 6 MB.");
        }
        byte[] data;
        try {
            data = file.getBytes();
        } catch (IOException e) {
            throw new BusinessException("No se pudo leer la imagen. Intente de nuevo.");
        }
        String normalized = normalizeSide(side);
        ItemImage image = imageRepository.findByItemIdAndSide(itemId, normalized)
                .orElseGet(() -> ItemImage.builder().item(item).side(normalized).build());
        image.setContentType(contentType);
        image.setData(data);
        image.setSizeBytes(data.length);
        image.setSource(ItemImage.SOURCE_UPLOAD);
        image.setUpdatedBy(user);
        imageRepository.save(image);
    }

    @Transactional
    public void deleteImage(Long itemId, String side) {
        Item item = find(itemId);
        permissionService.requireEdit(currentUserService.currentUser(), item.getModule());
        imageRepository.findByItemIdAndSide(itemId, normalizeSide(side)).ifPresent(imageRepository::delete);
    }

    private Item find(Long id) {
        return itemRepository.findWithModule(id)
                .orElseThrow(() -> new ResourceNotFoundException("El artículo no existe."));
    }

    private static String normalizeSide(String side) {
        String value = side == null ? "" : side.trim().toUpperCase(Locale.ROOT);
        return switch (value) {
            case "FRONT", "DELANTERA" -> ItemImage.FRONT;
            case "BACK", "TRASERA" -> ItemImage.BACK;
            default -> throw new BusinessException("La imagen debe ser la delantera o la trasera.");
        };
    }

    private static String unitOrDefault(String unit, InventoryModule module) {
        String value = clean(unit);
        return value == null ? module.getDefaultUnit() : value;
    }

    private static String cleanCode(String code) {
        String value = clean(code);
        return value == null ? null : value.toUpperCase(Locale.ROOT);
    }

    private static String clean(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
