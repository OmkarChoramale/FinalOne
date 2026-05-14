package com.tourismgov.event.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.tourismgov.event.client.NotificationClient;
import com.tourismgov.event.client.ProgramClient;
import com.tourismgov.event.client.SiteClient;
import com.tourismgov.event.client.UserClient;
import com.tourismgov.event.dto.AuditLogRequest;
import com.tourismgov.event.dto.CreateEventRequest;
import com.tourismgov.event.dto.EventResponse;
import com.tourismgov.event.dto.NotificationRequestDTO;
import com.tourismgov.event.dto.ProgramDto;
import com.tourismgov.event.dto.SiteDto;
import com.tourismgov.event.dto.UpdateEventStatusRequest;
import com.tourismgov.event.entity.Event;
import com.tourismgov.event.enums.EventStatus;
import com.tourismgov.event.exceptions.ErrorMessages;
import com.tourismgov.event.exceptions.ResourceNotFoundException;
import com.tourismgov.event.repository.EventRepository;
import com.tourismgov.event.security.SecurityUtils;

import feign.FeignException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class EventServiceImpl implements EventService {

    private static final String RESOURCE_EVENT = "EventService";
    private static final String ENTITY_NAME = "Event";
    private static final String ENTITY_SITE = "Heritage Site";
    private static final String ENTITY_PROGRAM = "Tourism Program";

    private static final String ACTION_EVENT_CREATE = "EVENT_CREATE";
    private static final String ACTION_EVENT_UPDATE = "EVENT_UPDATE";
    private static final String ACTION_EVENT_STATUS_UPDATE = "EVENT_STATUS_UPDATE";
    private static final String ACTION_EVENT_DELETE = "EVENT_DELETE";

    private static final String STATUS_SUCCESS = "SUCCESS";
    private static final String STATUS_FAILED = "FAILED";

    private final EventRepository eventRepository;
    private final UserClient userClient;
    private final NotificationClient notificationClient;
    private final SiteClient siteClient;
    private final ProgramClient programClient;

    @Override
    @Transactional
    public EventResponse createEvent(CreateEventRequest request) {
        log.info("Creating event: {}", request.getTitle());
        Long currentUserId = SecurityUtils.getCurrentUserId();

        // 1. Check for Duplicate Event
        if (eventRepository.existsByTitleAndSiteIdAndDate(request.getTitle(), request.getSiteId(), request.getDate())) {
            log.warn("Duplicate event creation attempt blocked for title: {}", request.getTitle());
            logAuditSafe(currentUserId, ACTION_EVENT_CREATE, RESOURCE_EVENT, STATUS_FAILED);
            throw new IllegalStateException(
                    "An event with this title is already scheduled at this site for the given date.");
        }

        // 2. Validate Site and Program strictly via Feign Clients and fetch Site
        SiteDto site;
        try {
            site = validateAndGetSite(request.getSiteId());
            validateProgram(request.getProgramId(), request.getDate());
        } catch (Exception e) {
            logAuditSafe(currentUserId, ACTION_EVENT_CREATE, RESOURCE_EVENT, STATUS_FAILED);
            throw e; 
        }

        // 3. Save Event
        Event event = new Event();
        event.setSiteId(request.getSiteId());
        event.setTitle(request.getTitle());
        event.setDate(request.getDate());
        
        // ---> AUTOMATIC LOCATION ASSIGNMENT <---
        if (request.getLocation() != null && !request.getLocation().isBlank()) {
            event.setLocation(site.getName() + " (" + request.getLocation() + ")");
        } else {
            event.setLocation(site.getName());
        }

        if (request.getStatus() != null) {
            event.setStatus(request.getStatus());
        } else {
            event.setStatus(EventStatus.SCHEDULED);
        }

        if (request.getProgramId() != null) {
            event.setProgramId(request.getProgramId());
        }

        Event saved = eventRepository.save(event);

        // 4. Audit Log
        logAuditSafe(currentUserId, ACTION_EVENT_CREATE, RESOURCE_EVENT, STATUS_SUCCESS);

        // 5. Global Broadcast Notification via perfectly formatted DTO
        String message = String.format("A new event '%s' has been scheduled at %s on %s.", 
                saved.getTitle(), saved.getLocation(), saved.getDate().toLocalDate());
        
        sendGlobalBroadcastSafe(currentUserId, saved.getEventId(), "New Event Scheduled!", message, "EVENT");

        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public EventResponse updateEvent(Long eventId, CreateEventRequest request) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException(ENTITY_NAME, eventId));

        Long currentUserId = SecurityUtils.getCurrentUserId();

        // STRICT IMMUTABILITY RULE FOR TERMINAL STATES
        if (event.getStatus() == EventStatus.CANCELLED || event.getStatus() == EventStatus.COMPLETED) {
            logAuditSafe(currentUserId, ACTION_EVENT_UPDATE, RESOURCE_EVENT, STATUS_FAILED);
            throw new IllegalStateException("Event details cannot be edited: This event is already " + event.getStatus() + ".");
        }

        // 1. Prevent updating to a duplicate of ANOTHER event
        if (eventRepository.existsByTitleAndSiteIdAndDateAndEventIdNot(request.getTitle(), request.getSiteId(),
                request.getDate(), eventId)) {
            log.warn("Update blocked: Conflicts with an existing event title: {}", request.getTitle());
            logAuditSafe(currentUserId, ACTION_EVENT_UPDATE, RESOURCE_EVENT, STATUS_FAILED);
            throw new IllegalStateException(
                    "Another event with this title is already scheduled at this site for the given date.");
        }

        // 2. Validate Site and Program status + dates during update and fetch Site
        SiteDto site;
        try {
            site = validateAndGetSite(request.getSiteId());
            validateProgram(request.getProgramId(), request.getDate());
        } catch (Exception e) {
            logAuditSafe(currentUserId, ACTION_EVENT_UPDATE, RESOURCE_EVENT, STATUS_FAILED);
            throw e;
        }

        // 3. Update fields
        event.setTitle(request.getTitle());
        event.setDate(request.getDate());
        event.setSiteId(request.getSiteId());

        // ---> AUTOMATIC LOCATION UPDATE <---
        if (request.getLocation() != null && !request.getLocation().isBlank()) {
            event.setLocation(site.getName() + " (" + request.getLocation() + ")");
        } else {
            event.setLocation(site.getName());
        }

        if (request.getProgramId() != null) {
            event.setProgramId(request.getProgramId());
        }

        if (request.getStatus() != null) {
            event.setStatus(request.getStatus());
        }

        Event updatedEvent = eventRepository.save(event);

        // 4. Audit Log
        logAuditSafe(currentUserId, ACTION_EVENT_UPDATE, RESOURCE_EVENT, STATUS_SUCCESS);

        // 5. Global Broadcast Notification for Updates via DTO
        String message = String.format("Event '%s' details have been updated.", updatedEvent.getTitle());
        sendGlobalBroadcastSafe(currentUserId, updatedEvent.getEventId(), "Event Details Updated", message, "EVENT");

        return mapToResponse(updatedEvent);
    }
    
    @Override
    public boolean eventExists(Long eventId) {
        log.debug("Checking existence of event ID: {}", eventId);
        return eventRepository.existsById(eventId);
    }

    @Override
    @Transactional
    public EventResponse updateEventStatus(Long eventId, UpdateEventStatusRequest request) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException(ENTITY_NAME, eventId));

        EventStatus oldStatus = event.getStatus();

        if (request.getStatus() != null) {
            event.setStatus(EventStatus.valueOf(request.getStatus().toString()));
        }

        Event updatedEvent = eventRepository.save(event);
        Long currentUserId = SecurityUtils.getCurrentUserId();

        logAuditSafe(currentUserId, ACTION_EVENT_STATUS_UPDATE, RESOURCE_EVENT, STATUS_SUCCESS);

        // Private System Alert Notification for Status Updates via DTO
        if (!oldStatus.equals(updatedEvent.getStatus())) {
            String message = String.format("Alert: Event '%s' status changed to %s.", event.getTitle(),
                    updatedEvent.getStatus().name());
            sendNotificationSafe(currentUserId, event.getEventId(), "Event Status Update", message, "ALERT");
        }

        return mapToResponse(updatedEvent);
    }

    @Override
    @Transactional
    public void cancelEventsByProgram(Long programId) {
        log.info(">>>> [EVENT-SERVICE] RECEIVED CANCELLATION REQUEST FOR PROGRAM ID: {}", programId);

        List<Event> events = eventRepository.findByProgramId(programId);

        if (events == null || events.isEmpty()) {
            log.error(">>>> [EVENT-SERVICE] FAILURE: No events found linked to Program ID: {}", programId);
            return;
        }

        log.info(">>>> [EVENT-SERVICE] SUCCESS: Found {} events. Updating status now...", events.size());

        events.forEach(event -> {
            log.info(">>>> [EVENT-SERVICE] Cancelling Event: {}", event.getTitle());
            event.setStatus(EventStatus.CANCELLED);
        });

        eventRepository.saveAll(events);
        log.info(">>>> [EVENT-SERVICE] ALL EVENTS SUCCESSFULLY CANCELLED IN DATABASE.");
    }

    @Override
    public EventResponse getEventById(Long eventId) {
        return eventRepository.findById(eventId).map(this::mapToResponse)
                .orElseThrow(() -> new ResourceNotFoundException(ENTITY_NAME, eventId));
    }

    @Override
    public List<EventResponse> getAllEvents() {
        return eventRepository.findAll().stream().map(this::mapToResponse).toList();
    }

    @Override
    public List<EventResponse> getEventsBySite(Long siteId) {
        return eventRepository.findBySiteId(siteId).stream().map(this::mapToResponse).toList();
    }

    @Override
    public List<EventResponse> getEventsByProgram(Long programId) {
        return eventRepository.findByProgramId(programId).stream().map(this::mapToResponse).toList();
    }

    @Override
    public Page<EventResponse> getEventsPaged(String status, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);

        if (status != null && !status.isBlank()) {
            try {
                EventStatus statusEnum = EventStatus.valueOf(status.toUpperCase());
                return eventRepository.findByStatus(statusEnum, pageable).map(this::mapToResponse);
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException(ErrorMessages.INVALID_STATUS);
            }
        }

        return eventRepository.findAll(pageable).map(this::mapToResponse);
    }

    @Override
    @Transactional
    public void deleteEvent(Long eventId) {
        // PROFESSIONAL SOFT DELETE
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException(ENTITY_NAME, eventId));
        
        log.info("Soft-deleting event ID: {}", eventId);
        event.setStatus(EventStatus.CANCELLED);
        eventRepository.save(event);
        
        logAuditSafe(SecurityUtils.getCurrentUserId(), ACTION_EVENT_DELETE, RESOURCE_EVENT, STATUS_SUCCESS);
    }

    // --- ENHANCED VALIDATION LOGIC WITH CIRCUIT BREAKER UNWRAPPING ---

    private SiteDto validateAndGetSite(Long siteId) {
        if (siteId == null) return null;
        
        try {
            SiteDto site = siteClient.getSiteById(siteId);

            if (site != null && "PERMANENTLY_CLOSED".equalsIgnoreCase(String.valueOf(site.getStatus()))) {
                throw new IllegalStateException(
                        "Event cannot be created: The heritage site is PERMANENTLY_CLOSED.");
            }
            return site; 
        } catch (FeignException.NotFound e) {
            throw new ResourceNotFoundException(ENTITY_SITE, siteId);
        } catch (IllegalStateException e) {
            throw e;
        } catch (Exception e) {
            if (e.getCause() instanceof FeignException feignEx) {
                if (feignEx.status() == 404) {
                    throw new ResourceNotFoundException(ENTITY_SITE, siteId);
                }
                if (feignEx.status() == 403) {
                    throw new IllegalStateException("Access Denied: The Event Service is not authorized to fetch Site ID: " + siteId);
                }
                if (feignEx.status() == 401) {
                    throw new IllegalStateException("Unauthorized: Authentication is missing for the Site Service request.");
                }
            }
            throw new RuntimeException(ErrorMessages.SITE_SERVICE_ERROR, e);
        }
    }

    private void validateProgram(Long programId, LocalDateTime eventDate) {
        if (programId == null) return;
        
        try {
            ProgramDto program = programClient.getProgramById(programId);

            String pStatus = String.valueOf(program.getStatus());
            if ("CANCELLED".equalsIgnoreCase(pStatus)) {
                throw new IllegalStateException("Event cannot be created: The associated Tourism Program is CANCELLED.");
            }
            if ("COMPLETED".equalsIgnoreCase(pStatus)) {
                throw new IllegalStateException("Event cannot be created: The associated Tourism Program is COMPLETED.");
            }

            if (eventDate != null) {
                LocalDate eDate = eventDate.toLocalDate();
                LocalDate pStart = program.getStartDate();
                LocalDate pEnd = program.getEndDate();

                if (pStart != null && eDate.isBefore(pStart)) {
                    throw new IllegalArgumentException(String.format("Invalid Event Date: You are giving a date (%s) before the program starts (%s).", eDate, pStart));
                }
                if (pEnd != null && eDate.isAfter(pEnd)) {
                    throw new IllegalArgumentException(String.format("Invalid Event Date: You are giving a date (%s) after the program ends (%s).", eDate, pEnd));
                }
            }
        } catch (FeignException.NotFound e) {
            throw new ResourceNotFoundException(ENTITY_PROGRAM, programId);
        } catch (IllegalStateException | IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            if (e.getCause() instanceof FeignException feignEx) {
                if (feignEx.status() == 404) {
                    throw new ResourceNotFoundException(ENTITY_PROGRAM, programId);
                }
                if (feignEx.status() == 403) {
                    throw new IllegalStateException("Access Denied: The Event Service is not authorized to fetch Program ID: " + programId);
                }
                if (feignEx.status() == 401) {
                    throw new IllegalStateException("Unauthorized: Authentication is missing for the Program Service request.");
                }
            }
            throw new RuntimeException("Error communicating with Program Service.", e);
        }
    }

    // --- REFACTORED DTO-BASED NOTIFICATION TRIGGERS ---

    private void sendGlobalBroadcastSafe(Long userId, Long entityId, String subject, String message, String category) {
        try {
            notificationClient.sendGlobalBroadcast(NotificationRequestDTO.builder()
                    .userId(userId)
                    .entityId(entityId)
                    .subject(subject)
                    .message(message)
                    .category(category)
                    .build());
            log.info("Global broadcast sent successfully for event ID: {}", entityId);
        } catch (Exception e) {
            log.error("Global broadcast failed: {}", e.getMessage());
        }
    }

    private void sendNotificationSafe(Long userId, Long entityId, String subject, String message, String category) {
        try {
            notificationClient.createNotification(NotificationRequestDTO.builder()
                    .userId(userId)
                    .entityId(entityId)
                    .subject(subject)
                    .message(message)
                    .category(category)
                    .build());
            log.info("Private notification sent to user: {}", userId);
        } catch (Exception e) {
            log.error("Failed to push targeted notification: {}", e.getMessage());
        }
    }

    private EventResponse mapToResponse(Event event) {
        EventResponse response = new EventResponse();
        response.setEventId(event.getEventId());
        response.setSiteId(event.getSiteId());
        response.setProgramId(event.getProgramId());
        response.setTitle(event.getTitle());
        response.setLocation(event.getLocation());
        response.setDate(event.getDate());

        if (event.getStatus() != null) {
            response.setStatus(event.getStatus().name());
        }

        return response;
    }

    private void logAuditSafe(Long userId, String action, String resource, String status) {
        try {
            AuditLogRequest auditRequest = new AuditLogRequest();
            auditRequest.setUserId(userId);
            auditRequest.setAction(action);
            auditRequest.setResource(resource);
            auditRequest.setStatus(status);
            userClient.logAction(auditRequest);
        } catch (Exception e) {
            log.error("Failed to push audit log to USER-SERVICE: {}", e.getMessage());
        }
    }
}