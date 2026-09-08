package com.dromatic.inventory.controller;

import com.dromatic.inventory.dto.MessageResponse;
import com.dromatic.inventory.dto.UserRequest;
import com.dromatic.inventory.dto.UserResponse;
import com.dromatic.inventory.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
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
        return ResponseEntity.ok(userService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<UserResponse> update(@PathVariable Long id, @Valid @RequestBody UserRequest request) {
        return ResponseEntity.ok(userService.update(id, request));
    }

    @PutMapping("/{id}/active")
    public ResponseEntity<MessageResponse> setActive(@PathVariable Long id, @RequestParam boolean active) {
        userService.setActive(id, active);
        return ResponseEntity.ok(new MessageResponse("Usuario actualizado correctamente."));
    }
}
