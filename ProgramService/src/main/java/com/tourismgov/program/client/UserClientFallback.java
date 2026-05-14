package com.tourismgov.program.client;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import com.tourismgov.program.dto.AuditLogRequest;

@Component
public class UserClientFallback implements UserClient {
    private static final Logger log = LoggerFactory.getLogger(UserClientFallback.class);

    @Override
    public void logAction(AuditLogRequest request) {
        // Log the failure instead of throwing an exception so the main process can continue
        log.error("Fallback triggered: Unable to log action to USER-SERVICE. Action may not be recorded.");
    }
}