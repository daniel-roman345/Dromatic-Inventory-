package com.dromatic.inventory.user;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Usuarios del sistema. Todas las rutas son solo para el administrador. */
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping
    public List<UserResponse> findAll() {
        return userService.findAll();
    }

    @GetMapping("/roles")
    public List<RoleResponse> roles() {
        return userService.roles();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TemporaryPasswordResponse create(@Valid @RequestBody UserRequest request) {
        return userService.create(request);
    }

    @PutMapping("/{id}")
    public UserResponse update(@PathVariable Long id, @Valid @RequestBody UserRequest request) {
        return userService.update(id, request);
    }

    @PatchMapping("/{id}/active")
    public UserResponse setActive(@PathVariable Long id, @RequestParam boolean value) {
        return userService.setActive(id, value);
    }

    @PostMapping("/{id}/unlock")
    public UserResponse unlock(@PathVariable Long id) {
        return userService.unlock(id);
    }

    @PostMapping("/{id}/reset-password")
    public TemporaryPasswordResponse resetPassword(@PathVariable Long id) {
        return userService.resetPassword(id);
    }
}
