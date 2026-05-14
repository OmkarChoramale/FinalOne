package com.tourismgov.tourist.security;

import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

@Component
public class SecurityUtils {

    private static final String ANONYMOUS_USER = "anonymousUser";

    public void validateAccess(Long targetUserId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        
        if (auth == null || !auth.isAuthenticated()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }

        var roles = auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toSet());

        // Staff bypass ID matching
        if (roles.contains("ROLE_ADMIN") || roles.contains("ROLE_OFFICER") || 
            roles.contains("ROLE_MANAGER") || roles.contains("ROLE_AUDITOR")) {
            return; 
        }

        // Tourists must match their own ID
        if (roles.contains("ROLE_TOURIST")) {
            Long loggedInUserId = this.getCurrentUserId(); 
            
            if (!loggedInUserId.equals(targetUserId)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access Denied: ID Mismatch");
            }
        } else {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Insufficient permissions");
        }
    }

    public void validateAdminOrStaff() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }

        var roles = auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toSet());

        boolean isStaff = roles.contains("ROLE_ADMIN") || roles.contains("ROLE_OFFICER") || 
                         roles.contains("ROLE_MANAGER") || roles.contains("ROLE_AUDITOR");

        if (!isStaff) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only staff can perform this action.");
        }
    }
    
    public Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated() || 
            ANONYMOUS_USER.equals(authentication.getPrincipal())) {
            
            throw new ResponseStatusException(
                HttpStatus.UNAUTHORIZED, 
                "You must be logged in to perform this action."
            );
        }

        // EXTRACT ID FROM THE NEW PRINCIPAL
        if (authentication.getPrincipal() instanceof CustomUserPrincipal principal) {
            return principal.userId();
        } 
        // Fallbacks in case filter was bypassed in a test environment
        else if (authentication.getPrincipal() instanceof Long userId) {
            return userId;
        } else if (authentication.getPrincipal() instanceof String userIdStr) {
             try {
                 return Long.parseLong(userIdStr);
             } catch (NumberFormatException e) {
                 throw new ResponseStatusException(
                     HttpStatus.INTERNAL_SERVER_ERROR, 
                     "Security context error: Invalid User ID format."
                 );
             }
        }

        throw new ResponseStatusException(
            HttpStatus.INTERNAL_SERVER_ERROR, 
            "Security context error: Could not verify user identity."
        );
    }
    
    // NEW METHOD FOR EMAIL
    public String getCurrentUserEmail() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        if (authentication != null && authentication.getPrincipal() instanceof CustomUserPrincipal principal) {
            return principal.email();
        }
        
        throw new ResponseStatusException(
            HttpStatus.UNAUTHORIZED, 
            "Email not found in security context."
        );
    }
}