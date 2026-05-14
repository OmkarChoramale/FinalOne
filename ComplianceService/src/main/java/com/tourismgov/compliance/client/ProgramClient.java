package com.tourismgov.compliance.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "PROGRAM-SERVICE")
public interface ProgramClient {

    @GetMapping("/tourismgov/v1/programs/{id}/exists")
    boolean programExists(@PathVariable("id") Long programId);
}