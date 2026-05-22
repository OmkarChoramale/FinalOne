package com.tourismgov.report.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;

import com.tourismgov.report.dto.ComplianceDTO;

import java.util.List;

@FeignClient(name = "COMPLIANCE-SERVICE", fallback = ComplianceClientFallback.class)
public interface ComplianceClient {
    
    // Updated to match the new controller endpoint
    @GetMapping("/tourismgov/v1/compliance/records/all")
    List<ComplianceDTO> getAllComplianceRecords();
}