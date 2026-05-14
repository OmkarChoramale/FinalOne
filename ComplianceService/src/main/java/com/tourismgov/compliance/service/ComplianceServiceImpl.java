package com.tourismgov.compliance.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.context.annotation.Lazy;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.tourismgov.compliance.client.EventClient;
import com.tourismgov.compliance.client.ProgramClient;
import com.tourismgov.compliance.client.SiteClient;
import com.tourismgov.compliance.client.UserClient;
import com.tourismgov.compliance.dto.AuditLogRequest;
import com.tourismgov.compliance.dto.AuditRequestDTO;
import com.tourismgov.compliance.dto.ComplianceRecordRequestDTO;
import com.tourismgov.compliance.dto.ComplianceRecordResponseDTO;
import com.tourismgov.compliance.entity.ComplianceRecord;
import com.tourismgov.compliance.enums.AuditStatus;
import com.tourismgov.compliance.enums.ComplianceResult;
import com.tourismgov.compliance.enums.ComplianceType;
import com.tourismgov.compliance.exceptions.ResourceNotFoundException;
import com.tourismgov.compliance.repository.ComplianceRecordRepository;
import com.tourismgov.compliance.security.SecurityUtils;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
@Transactional(readOnly = true)
public class ComplianceServiceImpl implements ComplianceService {

    private final ComplianceRecordRepository complianceRepository;
    private final UserClient userClient;
    private final AuditService auditService; // Lazy injected
    private final SiteClient siteClient;
    private final EventClient eventClient;
    private final ProgramClient programClient;

    // Manual constructor to handle @Lazy properly alongside other dependencies
    public ComplianceServiceImpl(
            ComplianceRecordRepository complianceRepository,
            UserClient userClient,
            @Lazy AuditService auditService, // ✅ This prevents circular dependency
            SiteClient siteClient,
            EventClient eventClient,
            ProgramClient programClient) {
        this.complianceRepository = complianceRepository;
        this.userClient = userClient;
        this.auditService = auditService;
        this.siteClient = siteClient;
        this.eventClient = eventClient;
        this.programClient = programClient;
    }

    @Override
    @Transactional
    public ComplianceRecordResponseDTO createComplianceCheck(ComplianceRecordRequestDTO request) {

        log.info("Creating compliance record for REF: {}", request.getReferenceNumber());

        validateEntityExists(request.getType(), request.getEntityId());
        checkDuplicatePendingCompliance(request.getType(), request.getEntityId());

        // 1. Create and Save Compliance Record
        ComplianceRecord record = new ComplianceRecord();
        record.setReferenceNumber(request.getReferenceNumber());
        record.setEntityId(request.getEntityId());
        record.setType(request.getType());
        record.setNotes(request.getNotes());
        record.setResult(ComplianceResult.PENDING_REVIEW);
        record.setDate(LocalDateTime.now());

        ComplianceRecord saved = complianceRepository.save(record);

        // 2. ✅ CONNECTION: Automatically trigger an Audit for the Auditor
        try {
            AuditRequestDTO auditRequest = new AuditRequestDTO();
            auditRequest.setScope("COMPLIANCE_REF_" + saved.getReferenceNumber());
            auditRequest.setFindings(String.format(
                "Automated Audit: %s evaluation for Entity ID %d. Officer Notes: %s", 
                saved.getType(), saved.getEntityId(), saved.getNotes()
            ));
            auditRequest.setStatus(AuditStatus.PLANNED); 
            auditRequest.setDate(LocalDateTime.now());

            // Call the other service
            auditService.recordAudit(auditRequest);
            log.info("Audit link successfully created for Ref: {}", saved.getReferenceNumber());
        } catch (Exception e) {
            log.error("Compliance created, but failed to trigger audit: {}", e.getMessage());
            // We catch this so the compliance record isn't rolled back if the audit logging fails
        }

        // 3. Log Action
        Long officerId = SecurityUtils.getCurrentUserId();
        userClient.logAction(new AuditLogRequest(
            officerId, 
            "COMPLIANCE_CREATED", 
            "REF_" + saved.getReferenceNumber(), 
            "SUCCESS"
        ));

        return mapToComplianceDto(saved);
    }

    @Override
    public Page<ComplianceRecordResponseDTO> getAllComplianceRecords(Pageable pageable) {
        return complianceRepository.findAll(pageable).map(this::mapToComplianceDto);
    }

    @Override
    public ComplianceRecordResponseDTO getComplianceRecordById(Long recordId) {
        return complianceRepository.findById(recordId)
                .map(this::mapToComplianceDto)
                .orElseThrow(() -> new ResourceNotFoundException("Compliance Record", recordId));
    }

    @Override
    @Transactional
    public ComplianceRecordResponseDTO updateComplianceResult(Long recordId, String result) {
        ComplianceRecord record = complianceRepository.findById(recordId)
                .orElseThrow(() -> new ResourceNotFoundException("Compliance Record", recordId));

        try {
            record.setResult(ComplianceResult.valueOf(result.toUpperCase()));
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException(
                    "Invalid Result. Allowed: COMPLIANT, NON_COMPLIANT, PARTIALLY_COMPLIANT, PENDING_REVIEW, EXEMPT");
        }

        ComplianceRecord updated = complianceRepository.save(record);
        
        userClient.logAction(new AuditLogRequest(
            SecurityUtils.getCurrentUserId(), 
            "COMPLIANCE_UPDATED", 
            "REF_" + record.getReferenceNumber(), 
            "SUCCESS"
        ));

        return mapToComplianceDto(updated);
    }

    @Override
    public List<ComplianceRecordResponseDTO> getAllComplianceRecordsList() {
        log.debug("Fetching unpaginated compliance records for internal Feign clients");
        return complianceRepository.findAll().stream()
                .map(this::mapToComplianceDto) // FIXED: Was mapToDTO
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional
    public void deleteComplianceRecord(Long recordId) {
        ComplianceRecord record = complianceRepository.findById(recordId)
                .orElseThrow(() -> new ResourceNotFoundException("Compliance Record", recordId));

        userClient.logAction(new AuditLogRequest(
            SecurityUtils.getCurrentUserId(), 
            "COMPLIANCE_DELETED", 
            "REF_" + record.getReferenceNumber(), 
            "SUCCESS"
        ));

        complianceRepository.delete(record);
    }

    private ComplianceRecordResponseDTO mapToComplianceDto(ComplianceRecord r) {
        return ComplianceRecordResponseDTO.builder()
                .complianceId(r.getComplianceId())
                .referenceNumber(r.getReferenceNumber())
                .entityId(r.getEntityId())
                .type(r.getType())
                .result(r.getResult())
                .date(r.getDate())
                .notes(r.getNotes())
                .createdAt(r.getCreatedAt())
                .updatedAt(r.getUpdatedAt())
                .build();
    }

    private void validateEntityExists(ComplianceType type, Long entityId) {
        boolean exists = switch (type) {
            case SITE -> siteClient.siteExists(entityId);
            case EVENT -> eventClient.eventExists(entityId);
            case PROGRAM -> programClient.programExists(entityId);
            default -> throw new IllegalStateException("Unsupported entity type");
        };

        if (!exists) {
            throw new ResourceNotFoundException(type.name(), entityId);
        }
    }
    
    private void checkDuplicatePendingCompliance(ComplianceType type, Long entityId) {
        boolean exists = complianceRepository.existsByTypeAndEntityIdAndResult(
                type, entityId, ComplianceResult.PENDING_REVIEW);

        if (exists) {
            throw new IllegalStateException("A compliance check is already pending for this entity");
        }
    }
}