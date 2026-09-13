package com.dromatic.inventory.controller;

import com.dromatic.inventory.dto.MessageResponse;
import com.dromatic.inventory.dto.ProductRequest;
import com.dromatic.inventory.dto.ProductResponse;
import com.dromatic.inventory.model.ProductStatus;
import com.dromatic.inventory.service.ProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    /** Lista productos. {@code search} busca por código o nombre; {@code status} filtra ACTIVO/INACTIVO. */
    @GetMapping
    public ResponseEntity<List<ProductResponse>> findAll(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) ProductStatus status) {
        return ResponseEntity.ok(productService.search(search, status));
    }

    /** Alertas: productos activos con stock igual o menor al mínimo. */
    @GetMapping("/low-stock")
    public ResponseEntity<List<ProductResponse>> lowStock() {
        return ResponseEntity.ok(productService.findLowStock());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductResponse> findById(@PathVariable Long id) {
        return ResponseEntity.ok(productService.findById(id));
    }

    @PostMapping
    public ResponseEntity<ProductResponse> create(@Valid @RequestBody ProductRequest request,
                                                  Authentication authentication) {
        return ResponseEntity.status(HttpStatus.CREATED).body(productService.create(request, authentication.getName()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProductResponse> update(@PathVariable Long id, @Valid @RequestBody ProductRequest request) {
        return ResponseEntity.ok(productService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<MessageResponse> delete(@PathVariable Long id) {
        productService.delete(id);
        return ResponseEntity.ok(new MessageResponse("Producto eliminado correctamente."));
    }
}
