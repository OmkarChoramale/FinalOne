package com.tourismgov.event.client;

import org.springframework.stereotype.Component;
import com.tourismgov.event.dto.ProgramDto;

@Component
public class ProgramClientFallback implements ProgramClient {
    @Override
    public ProgramDto getProgramById(Long id) {
        // Return a default, empty, or cached ProgramDto to prevent cascading failures
        ProgramDto fallbackDto = new ProgramDto();
        return fallbackDto; 
    }
}