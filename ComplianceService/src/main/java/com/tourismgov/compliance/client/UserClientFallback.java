package com.tourismgov.compliance.client;

import org.springframework.stereotype.Component;
import com.tourismgov.compliance.client.UserClient;
import com.tourismgov.compliance.dto.AuditLogRequest;
import lombok.extern.slf4j.Slf4j;

@Component
@Slf4j
public class UserClientFallback implements UserClient {
    
    @Override
    public void logAction(AuditLogRequest request) {
        // We use request.getResource() because your DTO has 'private String resource;'
        log.error("USER-SERVICE is down! Local fallback log -> Action: {}, Resource: {}", 
                  request.getAction(), request.getResource());
    }
}