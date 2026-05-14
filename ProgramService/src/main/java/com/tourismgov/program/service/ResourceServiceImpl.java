package com.tourismgov.program.service;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.tourismgov.program.client.UserClient;
import com.tourismgov.program.dto.AuditLogRequest;
import com.tourismgov.program.dto.ResourceRequest;
import com.tourismgov.program.dto.ResourceResponse;
import com.tourismgov.program.entity.Resource;
import com.tourismgov.program.entity.TourismProgram;
import com.tourismgov.program.enums.ProgramStatus;
import com.tourismgov.program.enums.ResourceStatus;
import com.tourismgov.program.enums.ResourceType;
import com.tourismgov.program.exceptions.ProgramErrorMessages;
import com.tourismgov.program.exceptions.ResourceNotFoundException;
import com.tourismgov.program.repository.ResourceRepository;
import com.tourismgov.program.repository.TourismProgramRepository;
import com.tourismgov.program.security.SecurityUtils;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ResourceServiceImpl implements ResourceService {
    
    private final ResourceRepository resourceRepository;
    private final TourismProgramRepository programRepository;
    private final UserClient userClient;

    @Override
    @Transactional
    public ResourceResponse allocateResourceToProgram(Long programId, ResourceRequest request) {
        log.info("Request to allocate {} to Program ID: {}", request.getType(), programId);
        Long currentUserId = SecurityUtils.getCurrentUserId();

        TourismProgram program = programRepository.findById(programId)
                .orElseThrow(() -> new ResourceNotFoundException(ProgramErrorMessages.PROGRAM_NOT_FOUND, programId));

        if (program.getStatus() == ProgramStatus.CANCELLED || program.getStatus() == ProgramStatus.COMPLETED) {
            logAuditSafe(currentUserId, "ALLOCATE_RESOURCE_FAILED", ProgramErrorMessages.SERVICE_NAME, "FAILED");
            throw new IllegalStateException("Cannot allocate resources: Program is " + program.getStatus());
        }

        if (request.getType() == ResourceType.FUNDS) {
            List<ResourceStatus> activeStatuses = Arrays.asList(ResourceStatus.ALLOCATED, ResourceStatus.EXPENDED);
            
            // SAFE UNBOXING: Prevent NullPointerException if DB returns null
            Double dbFunds = resourceRepository.calculateTotalQuantityByStatus(programId, ResourceType.FUNDS, activeStatuses);
            double activeFunds = (dbFunds != null) ? dbFunds : 0.0;
            
            if (activeFunds + request.getQuantity() > program.getBudget()) {
                logAuditSafe(currentUserId, "ALLOCATE_RESOURCE_BUDGET_EXCEEDED", ProgramErrorMessages.SERVICE_NAME, "FAILED");
                throw new IllegalArgumentException("Insufficient Budget. Remaining: " + (program.getBudget() - activeFunds));
            }
        }

        Resource resource = new Resource();
        resource.setProgram(program);
        resource.setQuantity(request.getQuantity());
        resource.setType(request.getType()); 
        resource.setStatus(ResourceStatus.ALLOCATED); 

        Resource saved = resourceRepository.save(resource);
        logAuditSafe(currentUserId, "ALLOCATE_RESOURCE", ProgramErrorMessages.SERVICE_NAME, ProgramErrorMessages.STATUS_SUCCESS);
        
        return mapToResourceResponse(saved);
    }

    @Override
    @Transactional
    public ResourceResponse updateResourceStatus(Long resourceId, ResourceStatus newStatus) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        
        Resource resource = resourceRepository.findById(resourceId)
                .orElseThrow(() -> new ResourceNotFoundException(ProgramErrorMessages.RESOURCE_NOT_FOUND, resourceId));
        
        if (resource.getStatus() == ResourceStatus.CANCELLED) {
            throw new IllegalStateException("Cannot update a cancelled resource.");
        }
        if (resource.getStatus() == ResourceStatus.EXPENDED && newStatus != ResourceStatus.EXPENDED) {
             throw new IllegalStateException("Expended funds cannot be reversed or altered.");
        }

        resource.setStatus(newStatus);
        Resource updated = resourceRepository.save(resource);

        logAuditSafe(currentUserId, "UPDATE_RESOURCE_STATUS", ProgramErrorMessages.SERVICE_NAME, ProgramErrorMessages.STATUS_SUCCESS);
        return mapToResourceResponse(updated);
    }

    @Override
    public List<ResourceResponse> getResourcesByProgram(Long programId) {
        if (!programRepository.existsById(programId)) {
            throw new ResourceNotFoundException(ProgramErrorMessages.PROGRAM_NOT_FOUND, programId);
        }
        return resourceRepository.findByProgram_ProgramId(programId).stream()
                .map(this::mapToResourceResponse)
                .toList();
    }

    @Override
    @Transactional
    public void deleteResource(Long resourceId) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        
        Resource resource = resourceRepository.findById(resourceId)
                .orElseThrow(() -> new ResourceNotFoundException(ProgramErrorMessages.RESOURCE_NOT_FOUND, resourceId));
        
        if (resource.getStatus() == ResourceStatus.EXPENDED) {
            throw new IllegalStateException("Cannot remove funds that have already been expended.");
        }
        
        resource.setStatus(ResourceStatus.CANCELLED);
        resourceRepository.save(resource);
        
        logAuditSafe(currentUserId, "CANCEL_RESOURCE", ProgramErrorMessages.SERVICE_NAME,ProgramErrorMessages.STATUS_SUCCESS);
    }
    
    @Override
    public Map<String, Object> getProgramAnalysis(Long programId) {
        TourismProgram program = programRepository.findById(programId)
                .orElseThrow(() -> new ResourceNotFoundException(ProgramErrorMessages.PROGRAM_NOT_FOUND, programId));

        // SAFE UNBOXING: Prevent NPEs
        Double dbAllocated = resourceRepository.calculateTotalQuantityByStatus(programId, ResourceType.FUNDS, List.of(ResourceStatus.ALLOCATED));
        double allocatedFunds = (dbAllocated != null) ? dbAllocated : 0.0;
            
        Double dbExpended = resourceRepository.calculateTotalQuantityByStatus(programId, ResourceType.FUNDS, List.of(ResourceStatus.EXPENDED));
        double expendedFunds = (dbExpended != null) ? dbExpended : 0.0;

        Double dbStaff = resourceRepository.calculateTotalQuantityByStatus(programId, ResourceType.STAFF, List.of(ResourceStatus.ALLOCATED));
        double activeStaff = (dbStaff != null) ? dbStaff : 0.0;

        Long dbEquip = resourceRepository.countActiveResourcesByType(programId, ResourceType.EQUIPMENT);
        long equipmentCount = (dbEquip != null) ? dbEquip : 0L;

        Map<String, Object> analysis = new HashMap<>();
        analysis.put("programTitle", program.getTitle());
        analysis.put("programStatus", program.getStatus());
        
        Map<String, Object> financialData = new HashMap<>();
        financialData.put("totalProgramBudget", program.getBudget());
        financialData.put("currentlyAllocated", allocatedFunds);
        financialData.put("actuallySpent", expendedFunds);
        financialData.put("remainingInBudget", program.getBudget() - (allocatedFunds + expendedFunds));
        financialData.put("budgetUtilizationPercentage", (program.getBudget() > 0) ? 
                ((allocatedFunds + expendedFunds) / program.getBudget()) * 100 : 0);
        
        analysis.put("financialAnalysis", financialData);

        Map<String, Object> operationalData = new HashMap<>();
        operationalData.put("totalAssignedStaff", activeStaff);
        operationalData.put("equipmentUnitsTracked", equipmentCount);
        operationalData.put("isResourceReady", activeStaff > 0 && equipmentCount > 0);
        
        analysis.put("operationalAnalysis", operationalData);

        return analysis;
    }

    // --- Private Helper Methods ---

    private void logAuditSafe(Long userId, String action, String resource, String status) {
        try {
            AuditLogRequest auditRequest = new AuditLogRequest(userId, action, resource, status);
            userClient.logAction(auditRequest);
        } catch (Exception e) {
            log.error("Audit log failed to transmit: {}", e.getMessage());
            throw new IllegalStateException("System compliance failure: Audit log could not be generated.", e);
        }
    }

    private ResourceResponse mapToResourceResponse(Resource resource) {
        ResourceResponse res = new ResourceResponse();
        res.setResourceId(resource.getResourceId());
        
        // NULL CHECK: Prevents NPE if the program mapping is missing
        if (resource.getProgram() != null) {
            res.setProgramId(resource.getProgram().getProgramId());
        }
        
        res.setType(resource.getType());     
        res.setQuantity(resource.getQuantity());
        res.setStatus(resource.getStatus()); 
        return res;
    }
}