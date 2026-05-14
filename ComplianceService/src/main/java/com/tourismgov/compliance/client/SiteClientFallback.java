package com.tourismgov.compliance.client;

import org.springframework.stereotype.Component;
import com.tourismgov.compliance.client.SiteClient;
import lombok.extern.slf4j.Slf4j;

@Component
@Slf4j
public class SiteClientFallback implements SiteClient {
    @Override
    public boolean siteExists(Long siteId) {
        log.error("SITE-SERVICE is down! Fallback triggered for site ID: {}", siteId);
        return false;
    }
}