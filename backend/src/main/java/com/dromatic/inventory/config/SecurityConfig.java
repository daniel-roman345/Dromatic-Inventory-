package com.dromatic.inventory.config;

import com.dromatic.inventory.security.JwtAuthFilter;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import java.io.IOException;
import java.util.Arrays;
import java.util.List;

import static com.dromatic.inventory.model.Role.ADMINISTRADOR;
import static com.dromatic.inventory.model.Role.CONSULTA;
import static com.dromatic.inventory.model.Role.OPERADOR;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    @Value("${app.cors.allowed-origins}")
    private String allowedOrigins;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .httpBasic(basic -> basic.disable())
            .formLogin(form -> form.disable())
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint((req, res, e) ->
                    writeJson(res, HttpServletResponse.SC_UNAUTHORIZED, "Sesión no válida o expirada. Inicie sesión nuevamente."))
                .accessDeniedHandler((req, res, e) ->
                    writeJson(res, HttpServletResponse.SC_FORBIDDEN, "No tiene permisos para realizar esta acción.")))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                .requestMatchers("/error").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/auth/login").permitAll()

                // Solo administrador
                .requestMatchers("/api/users/**", "/api/reports/**").hasRole(ADMINISTRADOR)
                .requestMatchers(HttpMethod.POST, "/api/movements/*/void").hasRole(ADMINISTRADOR)

                // Movimientos, historial y dashboard: administrador y operador
                .requestMatchers("/api/movements/**", "/api/dashboard/**").hasAnyRole(ADMINISTRADOR, OPERADOR)

                // Consulta de inventario, alertas y ubicaciones: todos los roles
                .requestMatchers(HttpMethod.GET, "/api/products/**", "/api/locations/**")
                    .hasAnyRole(ADMINISTRADOR, OPERADOR, CONSULTA)

                // Registro de productos y ubicaciones: administrador y operador
                .requestMatchers(HttpMethod.POST, "/api/products", "/api/locations").hasAnyRole(ADMINISTRADOR, OPERADOR)

                // Editar / eliminar productos: solo administrador
                .requestMatchers("/api/products/**").hasRole(ADMINISTRADOR)
                .requestMatchers("/api/locations/**").hasAnyRole(ADMINISTRADOR, OPERADOR)

                .anyRequest().denyAll()
            )
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.stream(allowedOrigins.split(",")).map(String::trim).toList());
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("Authorization", "Content-Type"));
        configuration.setExposedHeaders(List.of("Content-Disposition"));

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", configuration);
        return source;
    }

    private static void writeJson(HttpServletResponse response, int status, String message) throws IOException {
        response.setStatus(status);
        response.setContentType("application/json;charset=UTF-8");
        response.getWriter().write("{\"message\":\"" + message + "\"}");
    }
}
