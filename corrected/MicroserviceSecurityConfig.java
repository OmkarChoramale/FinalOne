package com.tourismgov.compliance.security;

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
    private static final String AUDITOR = "AUDITOR";
    private static final String COMPLIANCE = "COMPLIANCE";
    
    // Removed unused roles (OFFICER, MANAGER, TOURIST) since they are no longer referenced

    private final GatewayHeaderFilter gatewayHeaderFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http.csrf(AbstractHttpConfigurer::disable)
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth

                // ==========================================
                // 0. INTERNAL FEIGN ENDPOINTS (service-to-service, no user headers)
                // ==========================================
                .requestMatchers(HttpMethod.GET, "/tourismgov/v1/compliance/records/all").permitAll()
                .requestMatchers(HttpMethod.GET, "/tourismgov/v1/audits/official").permitAll()
                
                // ==========================================
                // 1. AUDIT ENDPOINTS (/tourismgov/v1/audits)
                // ==========================================
                .requestMatchers(HttpMethod.POST, "/tourismgov/v1/audits/official").hasAnyRole(ADMIN, AUDITOR)
                .requestMatchers(HttpMethod.GET, "/tourismgov/v1/audits/official/**").hasAnyRole(ADMIN, AUDITOR)
                .requestMatchers(HttpMethod.PATCH, "/tourismgov/v1/audits/official/*").hasAnyRole(ADMIN, AUDITOR)

                // ==========================================
                // 2. COMPLIANCE ENDPOINTS (/tourismgov/v1/compliance/records)
                // ==========================================
                .requestMatchers(HttpMethod.POST, "/tourismgov/v1/compliance/records").hasAnyRole(ADMIN, AUDITOR, COMPLIANCE)
                .requestMatchers(HttpMethod.GET, "/tourismgov/v1/compliance/records/**").hasAnyRole(ADMIN, AUDITOR, COMPLIANCE)
                .requestMatchers(HttpMethod.PATCH, "/tourismgov/v1/compliance/records/*/result").hasAnyRole(ADMIN, AUDITOR, COMPLIANCE)
                .requestMatchers(HttpMethod.DELETE, "/tourismgov/v1/compliance/records/*").hasAnyRole(ADMIN, AUDITOR, COMPLIANCE)

                .anyRequest().authenticated()
            )
            .addFilterBefore(gatewayHeaderFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}