package com.tourismgov.tourist.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.tourismgov.tourist.dto.TouristRequest;
import com.tourismgov.tourist.dto.TouristResponse;
import com.tourismgov.tourist.dto.TouristSummaryResponse;
import com.tourismgov.tourist.dto.TouristUpdateRequest;
import com.tourismgov.tourist.enums.Status;

/**
 * Service interface for managing tourist records in the government tourism system.
 * Provides CRUD operations and summary retrieval for tourists.
 */
public interface TouristService {

    /**
     * Creates a new tourist record based on the provided request data.
     *
     * @param request the tourist details to be created
     * @return the created tourist information as a response DTO
     */
    public TouristResponse createTourist(TouristRequest request);

    /**
     * Retrieves a tourist record by its unique identifier.
     *
     * @return the tourist information as a response DTO
     */
    public TouristResponse getTouristById(Long userId);

    /**
     * Updates an existing tourist record with new details.
     *
     * @param request   the updated tourist details
     * @return the updated tourist information as a response DTO
     */
    public TouristResponse updateTourist(Long userId,TouristUpdateRequest request);

    /**
     * Deletes a tourist record by its unique identifier.
     *
     */
    public void deleteTourist(Long touristId);

    /**
     * Retrieves a paginated list of tourist summaries filtered by status.
     *
     * @param status   the status to filter tourists (e.g., ACTIVE, INACTIVE)
     * @param pageable pagination and sorting information
     * @return a page of tourist summary response DTOs
     */
    public Page<TouristSummaryResponse> getTouristSummariesByStatus(Status status, Pageable pageable);
    
    
    public TouristResponse getTouristByTouristId(Long touristId);

}
