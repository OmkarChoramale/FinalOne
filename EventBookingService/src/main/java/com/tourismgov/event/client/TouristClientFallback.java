package com.tourismgov.event.client;

import org.springframework.stereotype.Component;
import com.tourismgov.event.dto.TouristDTO;

@Component
public class TouristClientFallback implements TouristClient {

    @Override
    public TouristDTO getTouristByUserId(Long userId) {
        return new TouristDTO(); // Return empty object
    }

    @Override
    public TouristDTO getTouristById(Long touristId) {
        return new TouristDTO(); // Return empty object
    }
}