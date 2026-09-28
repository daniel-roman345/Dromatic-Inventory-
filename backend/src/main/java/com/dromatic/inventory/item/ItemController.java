package com.dromatic.inventory.item;

import com.dromatic.inventory.common.web.PageResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/items")
@RequiredArgsConstructor
public class ItemController {

    private final ItemService itemService;
    private final ItemQueryService queryService;

    /**
     * Inventario de un módulo con buscador y filtros.
     *
     * @param module     código del módulo (POTES, TAPAS...) o vacío para todos
     * @param lowStock   solo los que están en stock bajo
     * @param unverified solo los que tienen rótulos por verificar
     */
    @GetMapping
    public PageResponse<ItemRow> search(@RequestParam(required = false) String module,
                                        @RequestParam(required = false) String q,
                                        @RequestParam(required = false, defaultValue = "ACTIVO") String status,
                                        @RequestParam(defaultValue = "false") boolean lowStock,
                                        @RequestParam(defaultValue = "false") boolean unverified,
                                        @RequestParam(defaultValue = "0") int page,
                                        @RequestParam(defaultValue = "50") int size) {
        return queryService.search(module, q, "TODOS".equalsIgnoreCase(status) ? null : status, lowStock, unverified,
                page, size);
    }

    @GetMapping("/{id}")
    public ItemDetailResponse detail(@PathVariable Long id) {
        return queryService.detail(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ItemDetailResponse create(@Valid @RequestBody ItemRequest request) {
        return queryService.detail(itemService.create(request).getId());
    }

    @PutMapping("/{id}")
    public ItemDetailResponse update(@PathVariable Long id, @Valid @RequestBody ItemRequest request) {
        itemService.update(id, request);
        return queryService.detail(id);
    }

    @PatchMapping("/{id}/status")
    public ItemDetailResponse setStatus(@PathVariable Long id, @RequestParam String value) {
        itemService.setStatus(id, value);
        return queryService.detail(id);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        itemService.delete(id);
    }

    /** Imagen delantera (FRONT) o trasera (BACK). */
    @GetMapping("/{id}/images/{side}")
    public ResponseEntity<byte[]> image(@PathVariable Long id, @PathVariable String side) {
        ItemImage image = itemService.image(id, side);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(image.getContentType()))
                .cacheControl(CacheControl.noCache())
                .body(image.getData());
    }

    @PutMapping(value = "/{id}/images/{side}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ItemDetailResponse uploadImage(@PathVariable Long id, @PathVariable String side,
                                          @RequestParam("file") MultipartFile file) {
        itemService.saveImage(id, side, file);
        return queryService.detail(id);
    }

    @DeleteMapping("/{id}/images/{side}")
    public ItemDetailResponse deleteImage(@PathVariable Long id, @PathVariable String side) {
        itemService.deleteImage(id, side);
        return queryService.detail(id);
    }
}
