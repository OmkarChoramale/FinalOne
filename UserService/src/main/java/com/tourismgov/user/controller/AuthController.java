package com.tourismgov.user.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.tourismgov.user.dto.AuthRequest;
import com.tourismgov.user.dto.AuthResponse;
import com.tourismgov.user.dto.PasswordResetRequest;
import com.tourismgov.user.dto.PasswordUpdateRequest;
import com.tourismgov.user.dto.UserRequest;
import com.tourismgov.user.dto.UserResponse;
import com.tourismgov.user.service.AuthService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/tourismgov/v1/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<UserResponse> register(@Valid @RequestBody UserRequest request) {
        log.info("REST request to register user: {}", request.getEmail());
        UserResponse response = authService.registerUser(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody AuthRequest request) {
        log.info("REST request to login user: {}", request.getEmail());
        AuthResponse response = authService.loginUser(request);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/password/update")
    public ResponseEntity<Void> updatePassword(@Valid @RequestBody PasswordUpdateRequest request) {
        log.info("REST request to update password for user ID: {}", request.getUserId());
        authService.updatePassword(request);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/password/reset")
    public ResponseEntity<Void> resetPassword(@Valid @RequestBody PasswordResetRequest request) {
        log.info("REST request to reset password for user ID: {}", request.getUserId());
        authService.resetPassword(request);
        return ResponseEntity.noContent().build();
    }
}