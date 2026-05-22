package com.tourismgov.report.client;

import java.util.Collections;
import java.util.List;

import org.springframework.stereotype.Component;

import com.tourismgov.report.dto.UserDTO;

import lombok.extern.slf4j.Slf4j;

@Component
@Slf4j
public class UserClientFallback implements UserClient {

    @Override
    public List<UserDTO> getAllUsers() {
        log.warn("FALLBACK: UserService unavailable. Returning empty users list.");
        return Collections.emptyList();
    }

    @Override
    public UserDTO getUserById(Long id) {
        log.warn("FALLBACK: UserService unavailable. Returning null for userId: {}", id);
        return null;
    }
}
