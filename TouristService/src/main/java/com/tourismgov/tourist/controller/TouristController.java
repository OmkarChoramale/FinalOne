package com.tourismgov.tourist.controller;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.tourismgov.tourist.dto.TouristRequest;
import com.tourismgov.tourist.dto.TouristResponse;
import com.tourismgov.tourist.dto.TouristSummaryResponse;
import com.tourismgov.tourist.dto.TouristUpdateRequest;
import com.tourismgov.tourist.enums.Status;
import com.tourismgov.tourist.security.SecurityUtils;
import com.tourismgov.tourist.service.TouristService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/tourismgov/v1/tourist")
public class TouristController {

	private final TouristService touristService;
	private final SecurityUtils securityUtils;
	
	// Tourist Registration
	@PostMapping("/create")
	public ResponseEntity<TouristResponse> createTourist(@Valid @RequestBody TouristRequest request) {
		log.info("API: create tourist called");
		Long userId = securityUtils.getCurrentUserId();
		request.setUserId(userId); 
		
		TouristResponse response = touristService.createTourist(request);
		return ResponseEntity.status(HttpStatus.CREATED).body(response);
	}

	// Tourist Profile
	@GetMapping("/profile")
	public ResponseEntity<TouristResponse> getTouristProfile() {
		Long userId = securityUtils.getCurrentUserId();
		TouristResponse response = touristService.getTouristById(userId);
		return ResponseEntity.ok(response);
	}

	// Tourist Profile (Edit)
	@PutMapping("/update")
	public ResponseEntity<TouristResponse> updateTouristProfile(
			@Valid @RequestBody TouristUpdateRequest request) {
		Long userId = securityUtils.getCurrentUserId();
		TouristResponse response = touristService.updateTourist(userId, request);
		return ResponseEntity.ok(response);
	}

	// Delete Tourist
	@DeleteMapping("/{touristId}")
	public ResponseEntity<String> deleteTourist(@PathVariable Long touristId) {
		touristService.deleteTourist(touristId);
		return ResponseEntity.ok("Tourist deleted successfully");
	}

	// List of Profiles
	@GetMapping("/admin")
	public ResponseEntity<Page<TouristSummaryResponse>> getTourists(@RequestParam(required = false) Status status,
			Pageable pageable) {
		Page<TouristSummaryResponse> response = touristService.getTouristSummariesByStatus(status, pageable);
		return ResponseEntity.ok(response);
	}

	// Fetch specific tourist by ID (For Admin/Officer)
	@GetMapping("/{touristId}")
	public ResponseEntity<TouristResponse> getTouristByTouristId(@PathVariable Long touristId) {
	    TouristResponse response = touristService.getTouristByTouristId(touristId);
	    return ResponseEntity.ok(response);
	}
}
