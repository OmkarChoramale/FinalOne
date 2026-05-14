package com.tourismgov.program.client;

import java.util.List;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "EVENT-SERVICE", fallback = EventClientFallback.class)
public interface EventClient {

    @GetMapping("/tourismgov/v1/events/program/{programId}/sites")
    List<Long> getSiteIdsByProgram(@PathVariable Long programId);

    @DeleteMapping("/tourismgov/v1/events/program/{programId}/unlink")
    void unlinkProgramFromAllEvents(@PathVariable Long programId);
}