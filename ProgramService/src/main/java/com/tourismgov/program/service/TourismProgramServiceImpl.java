package com.tourismgov.program.service;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.tourismgov.program.client.NotificationClient;
import com.tourismgov.program.client.UserClient;
import com.tourismgov.program.dto.AuditLogRequest;
import com.tourismgov.program.dto.NotificationRequestDTO; // ✅ Imported correct DTO
import com.tourismgov.program.dto.ProgramRequest;
import com.tourismgov.program.dto.ProgramResponse;
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
public class TourismProgramServiceImpl implements TourismProgramService {
    
    private final TourismProgramRepository programRepository;
    private final ResourceRepository resourceRepository;
    private final UserClient userClient; 
    private final NotificationClient notificationClient;

    @Override
    @Transactional
    public ProgramResponse createProgram(ProgramRequest request) {
        log.info("Professional Creation: Attempting to create program '{}'", request.getTitle());
        Long currentUserId = SecurityUtils.getCurrentUserId();

        if (programRepository.existsByTitleAndStartDate(request.getTitle(), request.getStartDate())) {
            logAuditSafe(currentUserId, "CREATE_PROGRAM_DUPLICATE", ProgramErrorMessages.SERVICE_NAME, ProgramErrorMessages.STATUS_FAILED);
            throw new IllegalStateException("Duplicate Program: A program with this title and start date already exists.");
        }

        validateProgramDates(request.getStartDate(), request.getEndDate(), true);

        TourismProgram program = new TourismProgram();
        mapRequestToEntity(request, program);

        LocalDate today = LocalDate.now();
        program.setStatus(program.getStartDate().isEqual(today) ? ProgramStatus.ACTIVE : ProgramStatus.PLANNED);

        TourismProgram saved = programRepository.save(program);
        logAuditSafe(currentUserId, "CREATE_PROGRAM", ProgramErrorMessages.SERVICE_NAME, ProgramErrorMessages.STATUS_SUCCESS);

        // ✅ REFACTORED: Send Global Broadcast for New Program
        sendCreationNotification(currentUserId, saved);
        
        return mapToProgramResponse(saved);
    }

    @Override
    @Transactional
    public ProgramResponse updateProgramStatus(Long id, String statusString) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        TourismProgram p = programRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(ProgramErrorMessages.PROGRAM_NOT_FOUND, id));
        
        if (p.getStatus() == ProgramStatus.CANCELLED) {
            logAuditSafe(currentUserId, "UPDATE_STATUS_FORBIDDEN", ProgramErrorMessages.SERVICE_NAME, ProgramErrorMessages.STATUS_FAILED);
            throw new IllegalStateException("Status cannot be updated: This program is already cancelled and finalized.");
        }

        ProgramStatus newStatus;
        try {
            newStatus = ProgramStatus.valueOf(statusString.toUpperCase());
        } catch (IllegalArgumentException e) {
            logAuditSafe(currentUserId, "UPDATE_STATUS_INVALID", ProgramErrorMessages.SERVICE_NAME, ProgramErrorMessages.STATUS_FAILED);
            throw new IllegalArgumentException("Invalid status. Allowed: PLANNED, ACTIVE, COMPLETED, CANCELLED");
        }

        if (p.getStatus() == newStatus) {
            return mapToProgramResponse(p); 
        }

        p.setStatus(newStatus);
        TourismProgram updated = programRepository.save(p);
        
        logAuditSafe(currentUserId, "UPDATE_STATUS", ProgramErrorMessages.SERVICE_NAME, ProgramErrorMessages.STATUS_SUCCESS);
        return mapToProgramResponse(updated);
    }

    @Override
    @Transactional
    public ProgramResponse updateProgram(Long programId, ProgramRequest request) {
        log.info("Updating Program ID: {}", programId);
        Long currentUserId = SecurityUtils.getCurrentUserId();

        TourismProgram program = programRepository.findById(programId)
                .orElseThrow(() -> new ResourceNotFoundException(ProgramErrorMessages.PROGRAM_NOT_FOUND, programId));

        if (program.getStatus() == ProgramStatus.CANCELLED) {
            logAuditSafe(currentUserId, "UPDATE_PROGRAM_FORBIDDEN", ProgramErrorMessages.SERVICE_NAME, ProgramErrorMessages.STATUS_FAILED);
            throw new IllegalStateException("Details cannot be edited: This program is already cancelled.");
        }

        Optional<TourismProgram> existing = programRepository.findByTitleAndStartDate(request.getTitle(), request.getStartDate());
        if (existing.isPresent() && !existing.get().getProgramId().equals(programId)) {
            throw new IllegalStateException("Conflict: Another program already exists with this title and date.");
        }

        if (program.getTitle().equals(request.getTitle()) &&
            program.getStartDate().isEqual(request.getStartDate()) &&
            program.getEndDate().isEqual(request.getEndDate()) &&
            Double.compare(program.getBudget(), request.getBudget()) == 0) {
            return mapToProgramResponse(program);
        }

        validateProgramDates(request.getStartDate(), request.getEndDate(), false);
        mapRequestToEntity(request, program);
        
        TourismProgram updated = programRepository.save(program);
        logAuditSafe(currentUserId, "UPDATE_PROGRAM", ProgramErrorMessages.SERVICE_NAME, ProgramErrorMessages.STATUS_SUCCESS);
        
        // ✅ NEW: Send Global Broadcast for Program Update
        sendUpdateNotification(currentUserId, updated);
        
        return mapToProgramResponse(updated);
    }

    @Override
    @Transactional
    public void deleteProgram(Long programId) {
        log.info("Cancelling Program ID: {}", programId);
        Long currentUserId = SecurityUtils.getCurrentUserId();

        TourismProgram program = programRepository.findById(programId)
                .orElseThrow(() -> new ResourceNotFoundException(ProgramErrorMessages.PROGRAM_NOT_FOUND, programId));
        
        if (program.getStatus() == ProgramStatus.CANCELLED) return;

        // Executes the DB bulk update resolving your IDE error
        resourceRepository.cancelActiveResources(programId);
        
        program.setStatus(ProgramStatus.CANCELLED);
        programRepository.save(program);
        
        logAuditSafe(currentUserId, "CANCEL_PROGRAM", ProgramErrorMessages.SERVICE_NAME, ProgramErrorMessages.STATUS_SUCCESS);
    }

    @Override
    public Map<String, Object> getBudgetReport(Long programId) {
        // 1. Fetch the program from the database
        TourismProgram program = programRepository.findById(programId)
                .orElseThrow(() -> new RuntimeException("Program not found with ID: " + programId));

        // 2. Calculate ONLY the 'FUNDS' that have been 'EXPENDED'
        double amountSpent = program.getResources().stream()
                // Ensure we only count items marked as expended
                .filter(res -> res.getStatus() == ResourceStatus.EXPENDED) 
                // Ensure we only deduct actual money, not staff or equipment headcounts
                .filter(res -> res.getType() == ResourceType.FUNDS) 
                .mapToDouble(Resource::getQuantity) 
                .sum();

        // 3. Calculate remaining
        double remainingBudget = program.getBudget() - amountSpent;

        // 4. Return the mapped report to the React frontend
        Map<String, Object> report = new HashMap<>();
        report.put("totalBudget", program.getBudget());
        report.put("amountSpent", amountSpent);
        report.put("remainingBudget", remainingBudget);

        return report;
    }

    // --- PRIVATE HELPERS ---

    private void validateProgramDates(LocalDate start, LocalDate end, boolean isNew) {
        if (start == null || end == null) throw new IllegalArgumentException("Start and End dates are required.");
        if (isNew && start.isBefore(LocalDate.now())) throw new IllegalArgumentException("Start date cannot be in the past.");
        if (!end.isAfter(start)) throw new IllegalArgumentException("End date must be strictly after the start date.");
    }

    // ✅ Refactored with DTO Notification logic
    private void sendCreationNotification(Long userId, TourismProgram saved) {
        try {
            String message = String.format("Tourism program '%s' has been officially initiated.", saved.getTitle());
            
            notificationClient.sendGlobalBroadcast(NotificationRequestDTO.builder()
                    .userId(userId) 
                    .entityId(saved.getProgramId())
                    .subject("New Program Launched!")
                    .message(message)
                    .category("PROGRAM")
                    .build());
        } catch (Exception e) {
            log.error("Failed to send global creation notification: {}", e.getMessage());
        }
    }

    // ✅ Added Update Notification logic based on your reference code
    private void sendUpdateNotification(Long userId, TourismProgram updated) {
        try {
            String message = String.format("The details for tourism program '%s' have been updated.", updated.getTitle());

            notificationClient.sendGlobalBroadcast(NotificationRequestDTO.builder()
                    .userId(userId) 
                    .entityId(updated.getProgramId())
                    .subject("Tourism Program Updated")
                    .message(message)
                    .category("PROGRAM")
                    .build());
        } catch (Exception e) {
            log.warn("Failed to send global update notification: {}", e.getMessage());
        }
    }

    private void mapRequestToEntity(ProgramRequest request, TourismProgram entity) {
        entity.setTitle(request.getTitle());
        entity.setDescription(request.getDescription());
        entity.setStartDate(request.getStartDate());
        entity.setEndDate(request.getEndDate());
        entity.setBudget(request.getBudget());
    }

    private ProgramResponse mapToProgramResponse(TourismProgram program) {
        ProgramResponse res = new ProgramResponse();
        res.setProgramId(program.getProgramId());
        res.setTitle(program.getTitle());
        res.setDescription(program.getDescription());
        res.setStartDate(program.getStartDate());
        res.setEndDate(program.getEndDate());
        res.setBudget(program.getBudget());
        res.setStatus(program.getStatus() != null ? program.getStatus().name() : null);
        
        res.setResources(resourceRepository.findByProgram_ProgramId(program.getProgramId()).stream()
                .map(this::mapToResourceResponse).toList());
        return res;
    }

    private ResourceResponse mapToResourceResponse(Resource r) {
        ResourceResponse res = new ResourceResponse();
        res.setResourceId(r.getResourceId());
        res.setProgramId(r.getProgram().getProgramId());
        res.setType(r.getType());
        res.setQuantity(r.getQuantity());
        res.setStatus(r.getStatus());
        return res;
    }

    private void logAuditSafe(Long userId, String action, String resource, String status) {
        try {
            userClient.logAction(new AuditLogRequest(userId, action, resource, status));
        } catch (Exception e) {
            log.error("Audit logging to User Service failed: {}", e.getMessage());
            throw new IllegalStateException("System compliance failure: Audit log could not be generated. Transaction aborted.", e);
        }
    }

    public List<ProgramResponse> getAllPrograms() { 
        return programRepository.findAll().stream().map(this::mapToProgramResponse).toList(); 
    }
    
    public ProgramResponse getProgramById(Long id) { 
        return programRepository.findById(id).map(this::mapToProgramResponse).orElseThrow(() -> new ResourceNotFoundException(ProgramErrorMessages.PROGRAM_NOT_FOUND, id)); 
    }
    
    public Page<ProgramResponse> getProgramsPaged(int page, int size) { 
        return programRepository.findAll(PageRequest.of(page, size)).map(this::mapToProgramResponse); 
    }
}