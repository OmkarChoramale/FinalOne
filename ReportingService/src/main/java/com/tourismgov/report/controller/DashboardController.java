package com.tourismgov.report.controller;

import com.tourismgov.report.dto.DashboardDTO;
import com.tourismgov.report.service.DashboardService;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("tourismgov/v1/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/stats")
    public ResponseEntity<DashboardDTO> getDashboardStats(
            @RequestHeader("X-User-Roles") String role, 
            @RequestHeader("X-User-Id") Long userId) {
        
        return ResponseEntity.ok(dashboardService.getDashboardMetrics(role, userId));
    }
}