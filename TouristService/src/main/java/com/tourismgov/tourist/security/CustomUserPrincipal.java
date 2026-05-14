package com.tourismgov.tourist.security;

public record CustomUserPrincipal(Long userId, String email) {
}