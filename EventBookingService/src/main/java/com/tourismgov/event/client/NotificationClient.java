package com.tourismgov.event.client;
 
import org.springframework.cloud.openfeign.FeignClient;

import org.springframework.web.bind.annotation.PostMapping;

import org.springframework.web.bind.annotation.RequestBody;

import com.tourismgov.event.dto.NotificationRequestDTO;
 
@FeignClient(name = "NOTIFICATION-SERVICE")

public interface NotificationClient {


    /**

     * PRIVATE MESSAGE: Fixed URL path to include /v1

     */

    @PostMapping("/tourismgov/v1/notifications") // ✅ Added /v1

    void createNotification(@RequestBody NotificationRequestDTO request);
 
    /**

     * GLOBAL NOTIFICATION: Fixed URL path to include /v1

     */

    @PostMapping("/tourismgov/v1/notifications/broadcast") // ✅ Added /v1

    void sendGlobalBroadcast(@RequestBody NotificationRequestDTO request);

}
 