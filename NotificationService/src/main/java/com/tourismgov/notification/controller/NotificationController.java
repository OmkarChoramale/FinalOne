package com.tourismgov.notification.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.tourismgov.notification.dto.NotificationRequestDTO;
import com.tourismgov.notification.dto.NotificationResponseDTO;
import com.tourismgov.notification.enums.NotificationCategory;
import com.tourismgov.notification.service.NotificationService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/tourismgov/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    // 1. GET all notifications for the logged-in user (userId from JWT via Gateway)
    @GetMapping
    public ResponseEntity<List<NotificationResponseDTO>> getAll(
            @RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(notificationService.getAll(userId));
    }

    // 2. GET unread notifications for the logged-in user
    @GetMapping("/unread")
    public ResponseEntity<List<NotificationResponseDTO>> getUnread(
            @RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(notificationService.getUnread(userId));
    }

    // 3. GET notifications by category for the logged-in user
    @GetMapping("/category/{category}")
    public ResponseEntity<List<NotificationResponseDTO>> getByCategory(
            @RequestHeader("X-User-Id") Long userId,
            @PathVariable NotificationCategory category) {
        return ResponseEntity.ok(notificationService.getByCategory(userId, category));
    }

    // 4. PATCH mark a single notification as READ (must be owner)
    @PatchMapping("/{id}/read")
    public ResponseEntity<NotificationResponseDTO> markAsRead(
            @PathVariable Long id,
            @RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(notificationService.markAsRead(id, userId));
    }

    // 5. PATCH mark ALL notifications as READ for the logged-in user

    @PatchMapping("/read-all")
    public ResponseEntity<String> markAllAsRead(
            @RequestHeader("X-User-Id") Long userId) {
        
        // Perform the service logic
        notificationService.markAllAsRead(userId);
        
        // Return a 200 OK with a descriptive message body
        return ResponseEntity.ok("All notifications marked as read successfully for userId: " + userId);
    }

    // 6. POST create a direct targeted notification
   
    @PostMapping
    public ResponseEntity<NotificationResponseDTO> create(
            @Valid @RequestBody NotificationRequestDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(notificationService.create(request));
    }

    // 7. POST broadcast to ALL users
  
    @PostMapping("/broadcast")
    public ResponseEntity<String> broadcast(
            @Valid @RequestBody NotificationRequestDTO request) {
        notificationService.sendGlobalNotification(request);
        return ResponseEntity.ok("Broadcast sent successfully to all users.");
    }

   
}