package com.tourismgov.compliance.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "SITE-SERVICE", fallback = SiteClientFallback.class)
public interface SiteClient {

    @GetMapping("/tourismgov/v1/sites/{siteId}/exists")
    boolean siteExists(@PathVariable Long siteId);
}