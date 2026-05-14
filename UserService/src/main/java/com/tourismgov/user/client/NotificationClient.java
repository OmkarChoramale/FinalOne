package com.tourismgov.user.client;


import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import com.tourismgov.user.dto.NotificationRequestDTO;

@FeignClient(name = "NOTIFICATION-SERVICE")
public interface NotificationClient {

    /**
     * PRIVATE MESSAGE: Hits @PostMapping in NotificationController
     */
    @PostMapping("/tourismgov/v1/notifications")
    void createNotification(@RequestBody NotificationRequestDTO request);

    /**
     * GLOBAL NOTIFICATION: Hits @PostMapping("/broadcast") in NotificationController
     */
    @PostMapping("/tourismgov/v1/notifications/broadcast")
    void sendGlobalBroadcast(@RequestBody NotificationRequestDTO request);
}