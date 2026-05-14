package com.tourismgov.tourist.security;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;

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
    private static final String HEADER_USER_EMAIL = "X-User-Email"; // NEW

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String userIdStr = request.getHeader(HEADER_USER_ID);
        String rolesStr = request.getHeader(HEADER_USER_ROLES);
        String emailStr = request.getHeader(HEADER_USER_EMAIL); // NEW

        if (userIdStr != null && rolesStr != null && emailStr != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            try {
                Long userId = Long.valueOf(userIdStr);
                
                // Convert comma-separated roles into Spring Security Authorities
                List<SimpleGrantedAuthority> authorities = Arrays.stream(rolesStr.split(","))
                        .map(role -> role.replaceAll("[\\[\\]\" ]", "")) // Remove [ ] " and spaces
                        .filter(role -> !role.isEmpty())
                        .map(role -> role.toUpperCase().startsWith("ROLE_") ? role.toUpperCase() : "ROLE_" + role.toUpperCase())
                        .map(SimpleGrantedAuthority::new)
                        .toList();
                
                // USE THE NEW PRINCIPAL OBJECT
                CustomUserPrincipal principal = new CustomUserPrincipal(userId, emailStr);
                
                UsernamePasswordAuthenticationToken authentication = 
                        new UsernamePasswordAuthenticationToken(principal, null, authorities);
                
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authentication);
                
                log.debug("Security Context set for User ID: {} with Roles: {} and Email: {}", userId, rolesStr, emailStr);
                
            } catch (NumberFormatException e) {
                log.error("Invalid User ID format in header: {}", userIdStr);
            }
        }

        filterChain.doFilter(request, response);
    }
}