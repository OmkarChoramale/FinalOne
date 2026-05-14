package com.tourismgov.event.security;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
public class GatewayHeaderFilter extends OncePerRequestFilter {

    private static final String HEADER_USER_ID = "X-User-Id";
    private static final String HEADER_USER_ROLES = "X-User-Roles";
    private static final String ROLE_PREFIX = "ROLE_";

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String userIdStr = request.getHeader(HEADER_USER_ID);
        String rolesStr = request.getHeader(HEADER_USER_ROLES);

        if (userIdStr != null && rolesStr != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            try {
                Long userId = Long.valueOf(userIdStr);
                
                // CRITICAL FIX: Clean up potential brackets from JWT arrays (e.g. "[ADMIN, USER]")
                String cleanRoles = rolesStr.replaceAll("[\\[\\]\"]", "");

                // Convert comma-separated roles into Spring Security Authorities safely
                List<SimpleGrantedAuthority> authorities = Arrays.stream(cleanRoles.split(","))
                        .map(String::trim)
                        .filter(role -> !role.isEmpty())
                        .map(role -> {
                            String formattedRole = role.toUpperCase();
                            return new SimpleGrantedAuthority(
                                formattedRole.startsWith(ROLE_PREFIX) ? formattedRole : ROLE_PREFIX + formattedRole
                            );
                        })
                        .collect(Collectors.toList());

                UsernamePasswordAuthenticationToken authentication = 
                        new UsernamePasswordAuthenticationToken(userId, null, authorities);
                
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authentication);
                
                log.debug("Security Context set for User ID: {} with Roles: {}", userId, authorities);
                
            } catch (NumberFormatException e) {
                log.error("Invalid User ID format in header: {}", userIdStr);
            }
        }

        filterChain.doFilter(request, response);
    }
}