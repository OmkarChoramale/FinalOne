package com.tourismgov.site.client;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import com.tourismgov.site.dto.AuditLogRequest;

@Component
public class UserClientFallback implements UserClient {
    
    private static final Logger log = LoggerFactory.getLogger(UserClientFallback.class);

    @Override
    public void logAction(AuditLogRequest request) {
        log.warn("Fallback triggered: USER-SERVICE is unreachable. Audit log for action '{}' was not recorded.", request.getAction());
    }
}