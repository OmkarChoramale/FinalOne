package com.tourismgov.tourist.service;

import java.time.LocalDate;
import java.time.Period;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

//import com.tourismgov.tourist.client.NotificationClient;
import com.tourismgov.tourist.dto.NotificationRequestDTO;
import com.tourismgov.tourist.dto.TouristRequest;
import com.tourismgov.tourist.dto.TouristResponse;
import com.tourismgov.tourist.dto.TouristSummaryResponse;
import com.tourismgov.tourist.dto.TouristUpdateRequest;
import com.tourismgov.tourist.enums.Status;
import com.tourismgov.tourist.exception.TouristErrorMessage;
import com.tourismgov.tourist.mapper.TouristMapper;
import com.tourismgov.tourist.model.Tourist;
import com.tourismgov.tourist.repository.TouristRepository;
import com.tourismgov.tourist.security.SecurityUtils;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class TouristServiceImpl implements TouristService {

    private final TouristRepository touristRepository;
    private final TouristMapper touristMapper;
    private final SecurityUtils securityUtils;
//  private final NotificationClient notificationClient;

    @Override
    @Transactional
    public TouristResponse createTourist(TouristRequest request) {
        Long currentUserId = securityUtils.getCurrentUserId();
        String verifiedEmail = securityUtils.getCurrentUserEmail(); // FETCH EMAIL
      
        log.info("Starting Tourist Profile Creation for authenticated user ID: {}", currentUserId);
        if (touristRepository.findByUserId(currentUserId).isPresent()) {
            log.error("Tourist profile already exists for user ID: {}", currentUserId);
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A tourist profile already exists for this account.");
        }

        Tourist tourist = touristMapper.toTouristEntity(request, currentUserId);
        tourist.setEmail(verifiedEmail.toLowerCase()); 
        
        validateAdult(tourist);

        Tourist savedTourist = touristRepository.save(tourist);
        sendNotificationSafe(
            currentUserId,
            savedTourist.getTouristId(),
            "Welcome to TourismGov!",
            "Your tourist profile has been created successfully!",
            "SYSTEM_CREATE"
        );

        return touristMapper.toResponse(savedTourist);
    }

    @Override
    public TouristResponse getTouristById(Long userId) {
        log.info("Fetching tourist profile for user ID: {}", userId);
        Tourist tourist = findTouristByUserIdOrThrow(userId);
        securityUtils.validateAccess(tourist.getUserId());
        
        log.info("Tourist {} fetched successfully", userId);
        return touristMapper.toResponse(tourist);
    }

    @Override
    @Transactional
    public TouristResponse updateTourist(Long userId, TouristUpdateRequest request) {
        log.info("Updating tourist profile for user ID: {}", userId);
        Tourist tourist = findTouristByUserIdOrThrow(userId);
        securityUtils.validateAccess(tourist.getUserId());
        
        touristMapper.updateEntityFromRequest(request, tourist);
        validateAdult(tourist);

        tourist = touristRepository.save(tourist);
        log.info("Tourist ID {} updated successfully", userId);

        return touristMapper.toResponse(tourist);
    }

    @Override
    @Transactional
    public void deleteTourist(Long touristId) {
        log.info("Attempting to delete tourist profile for user ID: {}", touristId);
        Tourist tourist = touristRepository.findById(touristId).orElseThrow(() -> {
            log.error("Tourist {} not found", touristId);
            return new ResponseStatusException(HttpStatus.NOT_FOUND,
                    String.format(TouristErrorMessage.ERROR_TOURIST_NOT_FOUND, touristId));
        });

        touristRepository.delete(tourist);
        log.info("Tourist {} deleted successfully", touristId);
    }

    @Override
    public Page<TouristSummaryResponse> getTouristSummariesByStatus(Status status, Pageable pageable) {
        securityUtils.validateAdminOrStaff();
        Page<Tourist> page = (status != null) ? touristRepository.findByStatus(status, pageable)
                : touristRepository.findAll(pageable);
        log.info("Fetched {} tourist records", page.getTotalElements());
        return page.map(t -> new TouristSummaryResponse(t.getTouristId(), t.getName(), t.getStatus()));
    }

    private Tourist findTouristByUserIdOrThrow(Long userId) {
        return touristRepository.findByUserId(userId).orElseThrow(() -> {
            log.error("Tourist profile not found for user ID: {}", userId);
            return new ResponseStatusException(HttpStatus.NOT_FOUND, "No tourist profile found for the current user");
        });
    }
    @Override
    public TouristResponse getTouristByTouristId(Long touristId) {
        // 1. Ensure only staff/admins can use this
        securityUtils.validateAdminOrStaff(); 

        // 2. Fetch by the tourist's actual database ID
        Tourist tourist = touristRepository.findById(touristId).orElseThrow(() -> {
            return new ResponseStatusException(HttpStatus.NOT_FOUND, "Tourist not found");
        });
        
        return touristMapper.toResponse(tourist);
    }
    

    private void validateAdult(Tourist tourist) {
        if (tourist.getDob() != null && Period.between(tourist.getDob(), LocalDate.now()).getYears() < 18) {
            log.error("Tourist {} is under 18 years old", tourist.getName());
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, TouristErrorMessage.ERROR_UNDERAGE_TOURIST);
        }
    }
    
    private void sendNotificationSafe(Long userId, Long entityId, String subject, String message, String category) {
        try {
            NotificationRequestDTO notificationReq = NotificationRequestDTO.builder()
                    .userId(userId)        // The user receiving the notification
                    .entityId(entityId)    // ID of the related Tourist record
                    .subject(subject)
                    .message(message)
                    .category(category)
                    .build();

//          notificationClient.createNotification(notificationReq);
            log.info("Welcome notification sent successfully to userId: {}", userId);
        } catch (Exception e) {
            // Fault-tolerance: Registration succeeds even if the notification fails
            log.error("Failed to push welcome notification: {}", e.getMessage());
        }
    }
}