package com.tourismgov.report.client;

import java.util.Collections;
import java.util.List;

import org.springframework.stereotype.Component;

import com.tourismgov.report.dto.EventDTO;

import lombok.extern.slf4j.Slf4j;

@Component
@Slf4j
public class EventClientFallback implements EventClient {

    @Override
    public List<EventDTO> getAllEvents() {
        log.warn("FALLBACK: EventBookingService unavailable. Returning empty events list.");
        return Collections.emptyList();
    }
}
