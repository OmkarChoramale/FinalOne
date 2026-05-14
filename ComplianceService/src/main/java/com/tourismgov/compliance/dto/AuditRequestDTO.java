package com.tourismgov.compliance.dto;

import java.time.LocalDateTime;
import com.tourismgov.compliance.enums.AuditStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class AuditRequestDTO {
    
    // Used to store the Compliance Reference Number (e.g., "COMP-2023-001")
    private String scope;
    
    // Stores the initial notes or results from the compliance check
    private String findings;
    
    // The timestamp of when the compliance was recorded
    private LocalDateTime date;
    
    // Usually set to PLANNED when automatically triggered
    private AuditStatus status;
    
    // Optional: Direct ID of the compliance record for easy lookup
    private Long complianceId;
}