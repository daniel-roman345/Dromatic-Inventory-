package com.dromatic.inventory.controller;

import com.dromatic.inventory.dto.MessageResponse;
import com.dromatic.inventory.dto.UserRequest;
import com.dromatic.inventory.dto.UserResponse;
import com.dromatic.inventory.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping
    public ResponseEntity<List<UserResponse>> findAll() {
        return ResponseEntity.ok(userService.findAll());
    }

    @PostMapping
    public ResponseEntity<UserResponse> create(@Valid @RequestBody UserRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(userService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<UserResponse> update(@PathVariable Long id, @Valid @RequestBody UserRequest request,
                                               Authentication authentication) {
        return ResponseEntity.ok(userService.update(id, request, authentication.getName()));
    }

    @PutMapping("/{id}/active")
    public ResponseEntity<MessageResponse> setActive(@PathVariable Long id, @RequestParam boolean active,
                                                     Authentication authentication) {
        userService.setActive(id, active, authentication.getName());
        return ResponseEntity.ok(new MessageResponse(active ? "Usuario activado." : "Usuario desactivado."));
    }

    @PutMapping("/{id}/unlock")
    public ResponseEntity<MessageResponse> unlock(@PathVariable Long id) {
        userService.unlock(id);
        return ResponseEntity.ok(new MessageResponse("Usuario desbloqueado."));
    }
}
