package com.dromatic.inventory.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.lang.NonNull;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Set;

/**
 * Mientras un usuario tenga la contraseña temporal (primer ingreso o restablecida por el
 * administrador), solo puede consultar su perfil y cambiar la contraseña.
 */
@Component
public class PasswordChangeRequiredFilter extends OncePerRequestFilter {

    private static final Set<String> ALLOWED = Set.of("/api/auth/me", "/api/auth/change-password", "/api/auth/login");

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain chain) throws ServletException, IOException {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof CustomUserDetails user
                && user.isMustChangePassword()
                && request.getRequestURI().startsWith("/api/")
                && !ALLOWED.contains(request.getRequestURI())
                && !"OPTIONS".equals(request.getMethod())) {
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write("{\"message\":\"Debe cambiar su contraseña temporal antes de continuar.\","
                    + "\"code\":\"PASSWORD_CHANGE_REQUIRED\"}");
            return;
        }
        chain.doFilter(request, response);
    }
}
