package com.tourismgov.event.client;

import org.springframework.stereotype.Component;
import com.tourismgov.event.dto.SiteDto;

@Component
public class SiteClientFallback implements SiteClient {
    @Override
    public SiteDto getSiteById(Long id) {
        return new SiteDto(); // Return an empty/default SiteDto
    }
}