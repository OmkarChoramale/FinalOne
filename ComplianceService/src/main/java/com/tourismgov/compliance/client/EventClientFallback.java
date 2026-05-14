package com.tourismgov.compliance.client;

import org.springframework.stereotype.Component;

import lombok.extern.slf4j.Slf4j;

@Component
@Slf4j
public class EventClientFallback implements EventClient {
    @Override
    public boolean eventExists(Long eventId) {
        log.error("EVENT-SERVICE is down! Fallback triggered for event ID: {}", eventId);
        return false; // Returning false ensures we don't accidentally approve an invalid event
    }
}