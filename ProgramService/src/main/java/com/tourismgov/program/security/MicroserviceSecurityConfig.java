package com.tourismgov.program.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import lombok.RequiredArgsConstructor;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class MicroserviceSecurityConfig {

    private static final String ADMIN = "ADMIN";
    private static final String OFFICER = "OFFICER";
    private static final String MANAGER = "MANAGER";
    private static final String AUDITOR = "AUDITOR";
    private static final String COMPLIANCE = "COMPLIANCE";
    
    private static final String PROGRAM_PATH_WILDCARD = "/tourismgov/v1/programs/*";

    private final GatewayHeaderFilter gatewayHeaderFilter;

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http) {
        try {
            http
                // CORS is intentionally disabled here. The API Gateway handles it.
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                    
                    // Allow pre-flight CORS requests explicitly just to let them pass through
                    .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                    // ==========================================
                    // TOURISM PROGRAM ENDPOINTS
                    // ==========================================
                    .requestMatchers(HttpMethod.GET, "/tourismgov/v1/programs").permitAll()
                    .requestMatchers(HttpMethod.GET, "/tourismgov/v1/programs/paged").permitAll()
                    .requestMatchers(HttpMethod.GET, "/tourismgov/v1/programs/*/budget-report").hasAnyRole(ADMIN, MANAGER, AUDITOR, COMPLIANCE)
                    
                    .requestMatchers(HttpMethod.POST, "/tourismgov/v1/programs").hasAnyRole(ADMIN, MANAGER)
                    .requestMatchers(HttpMethod.PUT, PROGRAM_PATH_WILDCARD).hasAnyRole(ADMIN, MANAGER)
                    .requestMatchers(HttpMethod.PATCH, "/tourismgov/v1/programs/*/status").hasAnyRole(ADMIN, MANAGER)
                    .requestMatchers(HttpMethod.DELETE, PROGRAM_PATH_WILDCARD).hasRole(ADMIN)

                    // ==========================================
                    // RESOURCE ALLOCATION ENDPOINTS 
                    // ==========================================
                    .requestMatchers(HttpMethod.POST, "/tourismgov/v1/programs/*/resources").hasAnyRole(ADMIN, MANAGER)
                    .requestMatchers(HttpMethod.GET, "/tourismgov/v1/programs/*/resources").hasAnyRole(ADMIN, MANAGER, OFFICER, AUDITOR, COMPLIANCE)
                    .requestMatchers(HttpMethod.GET, "/tourismgov/v1/programs/*/resource-analysis").hasAnyRole(ADMIN, MANAGER, AUDITOR, COMPLIANCE)
                    
                    .requestMatchers(HttpMethod.PATCH, "/tourismgov/v1/resources/*/status").hasAnyRole(ADMIN, MANAGER)
                    .requestMatchers(HttpMethod.DELETE, "/tourismgov/v1/resources/*").hasRole(ADMIN)

                    .anyRequest().authenticated()
                )
                .addFilterBefore(gatewayHeaderFilter, UsernamePasswordAuthenticationFilter.class);

            return http.build();
        } catch (Exception e) {
            throw new IllegalStateException("Failed to configure security filter chain", e);
        }
    }
}