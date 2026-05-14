package com.tourismgov.compliance.enums;

public enum AuditStatus {
    PLANNED,        // Initial state when Compliance is created
    IN_PROGRESS,    // Auditor has started the review
    UNDER_REVIEW,   // Auditor is verifying specific details
    COMPLETED,      // Audit finished, Compliance verified
    CANCELLED       // Audit stopped (e.g., if Compliance record was deleted)
}