package com.tourismgov.program.controller;

import java.util.List;
import java.util.Map;

import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.tourismgov.program.dto.ProgramRequest;
import com.tourismgov.program.dto.ProgramResponse;
import com.tourismgov.program.enums.ProgramStatus;
import com.tourismgov.program.service.TourismProgramService;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/tourismgov/v1")
@RequiredArgsConstructor
@Validated 
public class TourismProgramController {

    private final TourismProgramService programService;

    @PostMapping("/programs")
    public ResponseEntity<ProgramResponse> createProgram(@Valid @RequestBody ProgramRequest request) {
        log.info("REST request to create Tourism Program: '{}'", request.getTitle());
        return new ResponseEntity<>(programService.createProgram(request), HttpStatus.CREATED);
    }

    @GetMapping("/programs/{programId}")
    public ResponseEntity<ProgramResponse> getProgramById(
            @PathVariable @Positive(message = "Program ID must be positive") Long programId) {
        return ResponseEntity.ok(programService.getProgramById(programId));
    }

    @GetMapping("/programs")
    public ResponseEntity<List<ProgramResponse>> getAllPrograms() {
        return ResponseEntity.ok(programService.getAllPrograms());
    }

    @GetMapping("/programs/paged")
    public ResponseEntity<Page<ProgramResponse>> getProgramsPaged(
            @RequestParam(defaultValue = "0") @PositiveOrZero(message = "Page index must not be negative") int page,
            @RequestParam(defaultValue = "10") @Positive(message = "Page size must be greater than zero") int size) {
        return ResponseEntity.ok(programService.getProgramsPaged(page, size));
    }

    @PutMapping("/programs/{programId}")
    public ResponseEntity<ProgramResponse> updateProgram(
            @PathVariable @Positive(message = "Program ID must be positive") Long programId, 
            @Valid @RequestBody ProgramRequest request) {
        log.info("REST request to update Program ID: {}", programId);
        return ResponseEntity.ok(programService.updateProgram(programId, request));
    }

    @PatchMapping("/programs/{programId}/status")
    public ResponseEntity<ProgramResponse> updateProgramStatus(
            @PathVariable @Positive(message = "Program ID must be positive") Long programId,
            @RequestParam @NotNull(message = "Status is required") ProgramStatus status) {
        log.info("REST request to update status of Program ID: {} to {}", programId, status);
        return ResponseEntity.ok(programService.updateProgramStatus(programId, status.name()));
    }

    @DeleteMapping("/programs/{programId}")
    public ResponseEntity<Void> deleteProgram(
            @PathVariable @Positive(message = "Program ID must be positive") Long programId) {
        log.info("REST request to delete Program ID: {}", programId);
        programService.deleteProgram(programId);
        return ResponseEntity.noContent().build(); 
    }

    @GetMapping("/programs/{programId}/budget-report")
    public ResponseEntity<Map<String, Object>> getProgramBudgetReport(
            @PathVariable @Positive(message = "Program ID must be positive") Long programId) {
        return ResponseEntity.ok(programService.getBudgetReport(programId));
    }
}