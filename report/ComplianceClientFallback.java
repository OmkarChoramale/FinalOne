package com.tourismgov.report.client;

import java.util.Collections;
import java.util.List;

import org.springframework.stereotype.Component;

import com.tourismgov.report.dto.ComplianceDTO;

import lombok.extern.slf4j.Slf4j;

@Component
@Slf4j
public class ComplianceClientFallback implements ComplianceClient {

    @Override
    public List<ComplianceDTO> getAllComplianceRecords() {
        log.warn("FALLBACK: ComplianceService unavailable. Returning empty compliance records.");
        return Collections.emptyList();
    }
}
