package com.tourismgov.report.client;

import java.util.Collections;
import java.util.List;

import org.springframework.stereotype.Component;

import com.tourismgov.report.dto.NotificationRequestDTO;

import lombok.extern.slf4j.Slf4j;

/**
 * Fallback for NotificationClient — activated when NOTIFICATION-SERVICE is unavailable.
 * Report generation continues successfully; notification is silently skipped.
 */
@Component
@Slf4j
public class NotificationClientFallback implements NotificationClient {

    @Override
    public List<NotificationRequestDTO> getUnreadNotifications(Long userId) {
        log.warn("FALLBACK: NotificationService unavailable. Returning empty unread list for userId: {}", userId);
        return Collections.emptyList();
    }

    @Override
    public void createNotification(NotificationRequestDTO request) {
        log.warn("FALLBACK: NotificationService unavailable. Notification skipped — subject: '{}'", 
                 request.getSubject());
    }

    @Override
    public void sendGlobalBroadcast(NotificationRequestDTO request) {
        log.warn("FALLBACK: NotificationService unavailable. Broadcast skipped — subject: '{}'", 
                 request.getSubject());
    }
}
