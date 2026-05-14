package com.tourismgov.event.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import com.tourismgov.event.dto.TouristDTO;

@FeignClient(name = "TOURIST-SERVICE", fallback = TouristClientFallback.class)
public interface TouristClient {

    @GetMapping("/tourismgov/v1/tourist/user/{userId}") 
    TouristDTO getTouristByUserId(@PathVariable Long userId);

    @GetMapping("/tourismgov/v1/tourist/id/{touristId}")
    TouristDTO getTouristById(@PathVariable Long touristId);
}