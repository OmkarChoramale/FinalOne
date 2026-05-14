package com.tourismgov.compliance.controller;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.tourismgov.compliance.dto.ComplianceRecordRequestDTO;
import com.tourismgov.compliance.dto.ComplianceRecordResponseDTO;
import com.tourismgov.compliance.service.ComplianceService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/tourismgov/v1/compliance/records")
@RequiredArgsConstructor
public class ComplianceController {

    private final ComplianceService complianceService;

    /**
     * Create a new official compliance check.
     */
    @PostMapping
    public ResponseEntity<ComplianceRecordResponseDTO> logComplianceRecord(
            @Valid @RequestBody ComplianceRecordRequestDTO request) {
        
        log.info("REST request to log compliance record for REF: {}", request.getReferenceNumber());
        ComplianceRecordResponseDTO savedRecord = complianceService.createComplianceCheck(request);
        
        return new ResponseEntity<>(savedRecord, HttpStatus.CREATED);
    }

    /**
     * Fetch all compliance records with pagination (Used by Frontend).
     */
    @GetMapping
    public ResponseEntity<Page<ComplianceRecordResponseDTO>> getComplianceRegister(
            @PageableDefault(size = 20, sort = "createdAt") Pageable pageable) {
        
        log.info("REST request to get paginated compliance records");
        return ResponseEntity.ok(complianceService.getAllComplianceRecords(pageable));
    }

    /**
     * NEW: Fetch all compliance records without pagination (Used by Feign Clients).
     */
    @GetMapping("/all")
    public ResponseEntity<List<ComplianceRecordResponseDTO>> getAllComplianceRecordsList() {
        
        log.info("REST request to get all compliance records as a list for internal client");
        // Ensure you create this method in your ComplianceService
        return ResponseEntity.ok(complianceService.getAllComplianceRecordsList());
    }

    /**
     * Fetch a specific compliance record by its ID.
     */
    @GetMapping("/{recordId}")
    public ResponseEntity<ComplianceRecordResponseDTO> getComplianceRecordById(
            @PathVariable Long recordId) {
        
        log.info("REST request to get compliance record by ID: {}", recordId);
        return ResponseEntity.ok(complianceService.getComplianceRecordById(recordId));
    }

    /**
     * Update only the result of a compliance record.
     */
    @PatchMapping("/{recordId}/result")
    public ResponseEntity<ComplianceRecordResponseDTO> updateComplianceResult(
            @PathVariable Long recordId,
            @RequestParam("result") String result) {
        
        log.info("REST request to update compliance result for record ID: {} to {}", recordId, result);
        ComplianceRecordResponseDTO updatedRecord = complianceService.updateComplianceResult(recordId, result);
        
        return ResponseEntity.ok(updatedRecord);
    }

    /**
     * Delete a compliance record.
     */
    @DeleteMapping("/{recordId}")
    public ResponseEntity<Void> deleteComplianceRecord(@PathVariable Long recordId) {
        
        log.info("REST request to delete compliance record ID: {}", recordId);
        complianceService.deleteComplianceRecord(recordId);
        
        return ResponseEntity.noContent().build(); 
    }
}
