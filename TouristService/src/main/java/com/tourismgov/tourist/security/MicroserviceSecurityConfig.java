package com.tourismgov.tourist.security;

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
    private static final String TOURIST = "TOURIST";

    private final GatewayHeaderFilter gatewayHeaderFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // 1. Specific Admin/Officer Actions (Top Priority)
                .requestMatchers(HttpMethod.GET, "/tourismgov/v1/tourist/admin").hasAnyRole(ADMIN, OFFICER, MANAGER, AUDITOR)
                .requestMatchers(HttpMethod.PATCH, "/tourismgov/v1/touristdoc/*/documents/*/verify").hasAnyRole(OFFICER, MANAGER, ADMIN)
                
                // 2. Public Actions
                .requestMatchers(HttpMethod.POST, "/tourismgov/v1/tourist/create").hasRole(TOURIST)
                
                // 3. General Tourist Actions (Use ** for nested paths if needed)
                .requestMatchers(HttpMethod.DELETE, "/tourismgov/v1/tourist/*").hasRole(ADMIN)
                .requestMatchers(HttpMethod.PUT, "/tourismgov/v1/tourist/*/update").hasAnyRole(TOURIST, ADMIN)
                .requestMatchers(HttpMethod.GET, "/tourismgov/v1/tourist/*").hasAnyRole(TOURIST, ADMIN, OFFICER)

                // 4. Document Actions
                .requestMatchers(HttpMethod.DELETE, "/tourismgov/v1/touristdoc/*/documents/*").hasRole(ADMIN)
                .requestMatchers(HttpMethod.GET, "/tourismgov/v1/touristdoc/*/documents/*/view").hasAnyRole(TOURIST, OFFICER, ADMIN, AUDITOR)
                .requestMatchers(HttpMethod.POST, "/tourismgov/v1/touristdoc/*/documents").hasAnyRole(TOURIST, OFFICER, ADMIN)

                .anyRequest().authenticated()
            )
            .addFilterBefore(gatewayHeaderFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}