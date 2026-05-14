package com.tourismgov.compliance.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import com.tourismgov.compliance.dto.AuditLogRequest;
import com.tourismgov.compliance.client.UserClientFallback;

@FeignClient(name = "USER-SERVICE", fallback = UserClientFallback.class)
public interface UserClient {
    @PostMapping("/tourismgov/v1/audit-logs")
    void logAction(@RequestBody AuditLogRequest request);
}