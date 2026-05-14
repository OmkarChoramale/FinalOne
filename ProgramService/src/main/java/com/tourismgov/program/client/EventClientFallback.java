package com.tourismgov.program.client;

import java.util.Collections;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class EventClientFallback implements EventClient {
    private static final Logger log = LoggerFactory.getLogger(EventClientFallback.class);

    @Override
    public List<Long> getSiteIdsByProgram(Long programId) {
        log.warn("Fallback triggered: Returning empty site list for Program ID: {} because EVENT-SERVICE is down.", programId);
        // Returning an empty list safely prevents NullPointerExceptions in your services
        return Collections.emptyList(); 
    }

    @Override
    public void unlinkProgramFromAllEvents(Long programId) {
        log.error("Fallback triggered: Failed to unlink Program ID: {} from events. Manual database cleanup may be required later.", programId);
    }
}