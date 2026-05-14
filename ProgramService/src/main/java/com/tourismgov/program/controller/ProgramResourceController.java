package com.tourismgov.program.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.tourismgov.program.dto.ResourceRequest;
import com.tourismgov.program.dto.ResourceResponse;
import com.tourismgov.program.enums.ResourceStatus;
import com.tourismgov.program.service.ResourceService;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/tourismgov/v1")
@Validated
public class ProgramResourceController {

    private final ResourceService resourceService;

    @PostMapping("/programs/{programId}/resources")
    public ResponseEntity<?> allocateResource(
            @PathVariable @Positive(message = "Program ID must be positive") Long programId,
            @Valid @RequestBody ResourceRequest request) {
        try {
            log.info("REST request to allocate {} resource to Program ID: {}", request.getType(), programId);
            return new ResponseEntity<>(resourceService.allocateResourceToProgram(programId, request), HttpStatus.CREATED);
        } catch (Exception e) {
            log.error("Allocation failed: ", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/programs/{programId}/resources")
    public ResponseEntity<?> getResourcesForProgram(
            @PathVariable @Positive(message = "Program ID must be positive") Long programId) {
        try {
            List<ResourceResponse> resources = resourceService.getResourcesByProgram(programId);
            return ResponseEntity.ok(resources);
        } catch (Exception e) {
            log.error("Resource fetch failed for program {}: ", programId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Backend Crash: " + e.getMessage()));
        }
    }

    @PatchMapping("/resources/{resourceId}/status")
    public ResponseEntity<?> updateResourceStatus(
            @PathVariable @Positive(message = "Resource ID must be positive") Long resourceId,
            @RequestParam @NotNull(message = "Status is required") ResourceStatus status) {
        try {
            return ResponseEntity.ok(resourceService.updateResourceStatus(resourceId, status));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/resources/{resourceId}")
    public ResponseEntity<?> deleteResource(
            @PathVariable @Positive(message = "Resource ID must be positive") Long resourceId) {
        try {
            resourceService.deleteResource(resourceId);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", e.getMessage()));
        }
    }
    
    @GetMapping("/programs/{programId}/resource-analysis")
    public ResponseEntity<?> getProgramAnalysis(
            @PathVariable @Positive(message = "Program ID must be positive") Long programId) {
        try {
            return ResponseEntity.ok(resourceService.getProgramAnalysis(programId));
        } catch (Exception e) {
            log.error("Analysis fetch failed: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Analysis Crash: " + e.getMessage()));
        }
    }
}