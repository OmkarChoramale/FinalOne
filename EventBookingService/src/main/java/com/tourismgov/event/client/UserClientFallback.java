package com.tourismgov.event.client;

import org.springframework.stereotype.Component;
import com.tourismgov.event.dto.AuditLogRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Component
public class UserClientFallback implements UserClient {
    private static final Logger logger = LoggerFactory.getLogger(UserClientFallback.class);

    @Override
    public void logAction(AuditLogRequest request) {
        logger.warn("Fallback triggered: Audit logging failed. Action might not be recorded.");
    }
}