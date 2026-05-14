package com.tourismgov.notification.security;

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



    private final GatewayHeaderFilter gatewayHeaderFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http.csrf(AbstractHttpConfigurer::disable)
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth

                // ==========================================
                // INTERNAL: Service-to-Service endpoints (no auth required)
                // ==========================================
                // Allow other microservices to send notifications via Feign
                .requestMatchers(HttpMethod.POST, "/tourismgov/v1/notifications").permitAll()
                .requestMatchers(HttpMethod.GET,  "/tourismgov/v1/notifications/internal/**").permitAll()
                // Broadcast is open to internal Feign calls too
                .requestMatchers(HttpMethod.POST, "/tourismgov/v1/notifications/broadcast").permitAll()
                
                // ✅ FIXED: Allow internal dashboard calls to fetch unread counts without a JWT
             // You can change this back to .authenticated() now!
                .requestMatchers(HttpMethod.GET,  "/tourismgov/v1/notifications/unread").permitAll()

                // ==========================================
                // NOTIFICATION ENDPOINTS — require authenticated user
                // ==========================================
                .requestMatchers(HttpMethod.GET,  "/tourismgov/v1/notifications").authenticated()
                .requestMatchers(HttpMethod.GET,  "/tourismgov/v1/notifications/category/**").authenticated()
                .requestMatchers(HttpMethod.PATCH,"/tourismgov/v1/notifications/*/read").authenticated()
                .requestMatchers(HttpMethod.PATCH,"/tourismgov/v1/notifications/read-all").authenticated()

                .anyRequest().authenticated()
            )
            .addFilterBefore(gatewayHeaderFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}