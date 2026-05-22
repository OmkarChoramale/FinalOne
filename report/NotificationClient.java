package com.tourismgov.report.client;

import java.util.List;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;

import com.tourismgov.report.dto.NotificationRequestDTO; // ✅ Unified DTO

@FeignClient(name = "NOTIFICATION-SERVICE", fallback = NotificationClientFallback.class)
public interface NotificationClient {
	
    @GetMapping("/tourismgov/v1/notifications/unread")
    List<NotificationRequestDTO> getUnreadNotifications(@RequestHeader("X-User-Id") Long userId);

    @PostMapping("/tourismgov/v1/notifications")
    void createNotification(@RequestBody NotificationRequestDTO request);

    @PostMapping("/tourismgov/v1/notifications/broadcast")
    void sendGlobalBroadcast(@RequestBody NotificationRequestDTO request);
}