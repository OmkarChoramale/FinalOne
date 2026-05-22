package com.tourismgov.notification.client;

import java.util.Collections;
import java.util.List;

import org.springframework.stereotype.Component;

import com.tourismgov.notification.dto.UserDTO;

import lombok.extern.slf4j.Slf4j;

/**
 * Fallback for UserClient — activated when USER-SERVICE is unavailable.
 * Notification creation for a known userId still works.
 * Broadcast fails gracefully — logs warning, sends to no one.
 */
@Component
@Slf4j
public class UserClientFallback implements UserClient {

    @Override
    public UserDTO getUserById(Long id) {
        log.warn("FALLBACK: UserService unavailable. Returning null user for id: {}", id);
        return null;
    }

    @Override
    public List<UserDTO> getAllUsers() {
        log.warn("FALLBACK: UserService unavailable. Broadcast cannot fetch user list — returning empty.");
        return Collections.emptyList();
    }
}
