package com.tourismgov.compliance.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "EVENT-SERVICE", fallback = EventClientFallback.class)
public interface EventClient {

    @GetMapping("/tourismgov/v1/events/{eventId}/exists")
    boolean eventExists(@PathVariable Long eventId);
}