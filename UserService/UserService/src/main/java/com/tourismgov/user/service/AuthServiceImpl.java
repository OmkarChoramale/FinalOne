package com.tourismgov.user.service;

import static com.tourismgov.user.exceptions.SecurityErrorMessages.USER_NOT_FOUND;

import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.tourismgov.user.dto.AuthRequest;
import com.tourismgov.user.dto.AuthResponse;
import com.tourismgov.user.dto.PasswordResetRequest;
import com.tourismgov.user.dto.PasswordUpdateRequest;
import com.tourismgov.user.dto.UserRequest;
import com.tourismgov.user.dto.UserResponse;
import com.tourismgov.user.entity.User;
import com.tourismgov.user.enums.Status;
import com.tourismgov.user.exceptions.ResourceNotFoundException;
import com.tourismgov.user.repository.UserRepository;
import com.tourismgov.user.security.JwtUtil;
import com.tourismgov.user.security.SecurityUtils;
import com.tourismgov.user.client.TouristClient;
import com.tourismgov.user.client.NotificationClient; // ✅ Added
import com.tourismgov.user.dto.NotificationRequestDTO; // ✅ Added
import com.tourismgov.user.dto.TouristSyncRequest;
import com.tourismgov.user.enums.Role;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

	private static final String RESOURCE_AUTH_SERVICE = "AuthService";

	private static final String STATUS_SUCCESS = "SUCCESS";
	private static final String STATUS_FAILED = "FAILED";

	private static final String ACTION_USER_REGISTER = "USER_REGISTER";
	private static final String ACTION_USER_LOGIN = "USER_LOGIN";
	private static final String ACTION_UPDATE_PASSWORD = "UPDATE_PASSWORD";
	private static final String ACTION_RESET_PASSWORD = "RESET_PASSWORD";

	private final UserRepository userRepository;
	private final PasswordEncoder passwordEncoder;
	private final AuthenticationManager authenticationManager;
	private final UserDetailsService userDetailsService;
	private final JwtUtil jwtUtil;
	private final AuditLogService auditLogService;
	private final TouristClient touristClient;
	private final NotificationClient notificationClient; // ✅ Added

	// ---------------- REGISTER ----------------

	@Override
	@Transactional
	public UserResponse registerUser(UserRequest request) {

		if (userRepository.findByEmail(request.getEmail()).isPresent()) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already in use");
		}

		User user = new User();
		user.setName(request.getName());
		user.setEmail(request.getEmail());
		user.setPassword(passwordEncoder.encode(request.getPassword()));
		user.setPhone(request.getPhone());

		user.setRole(request.getRole());
		user.setStatus(Status.ACTIVE);

		User savedUser = userRepository.save(user);

		auditLogService.logActionInCurrentTransaction(savedUser.getUserId(), ACTION_USER_REGISTER,
				RESOURCE_AUTH_SERVICE, STATUS_SUCCESS);

		if (savedUser.getRole() == Role.TOURIST) {
			try {
				touristClient.syncTouristProfile(TouristSyncRequest.builder()
						.userId(savedUser.getUserId())
						.name(savedUser.getName())
						.email(savedUser.getEmail())
						.contactInfo(savedUser.getPhone())
						.build());
				log.info("Successfully synced tourist profile for user {}", savedUser.getUserId());
			} catch (Exception e) {
				log.error("Failed to sync tourist profile for user {}: {}", savedUser.getUserId(), e.getMessage());
			}
		}

		// ✅ Notification: Send private welcome alert
		String welcomeMsg = "Welcome to TourismGov, " + savedUser.getName() + "! Your account has been created successfully.";
		sendNotificationSafe(savedUser.getUserId(), savedUser.getUserId(), "Account Created", welcomeMsg, "SYSTEM");

		return mapToUserResponse(savedUser);
	}

	// ---------------- LOGIN ----------------

	@Override
	public AuthResponse loginUser(AuthRequest request) {

		try {
			authenticationManager
					.authenticate(new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));

			User user = userRepository.findByEmail(request.getEmail())
					.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, USER_NOT_FOUND));

			if (user.getStatus() != Status.ACTIVE) {
				auditLogService.logAction(user.getUserId(), ACTION_USER_LOGIN, RESOURCE_AUTH_SERVICE, STATUS_FAILED);
				throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Account is not active");
			}

			UserDetails userDetails = userDetailsService.loadUserByUsername(request.getEmail());

			String jwt = jwtUtil.generateToken(userDetails);

			auditLogService.logAction(user.getUserId(), ACTION_USER_LOGIN, RESOURCE_AUTH_SERVICE, STATUS_SUCCESS);

			return new AuthResponse(jwt, user.getUserId(), user.getRole().name(), user.getName());

		} catch (AuthenticationException ex) {

			userRepository.findByEmail(request.getEmail()).ifPresent(user -> auditLogService.logAction(user.getUserId(),
					ACTION_USER_LOGIN, RESOURCE_AUTH_SERVICE, STATUS_FAILED));

			log.warn("Failed login attempt for email: {}", request.getEmail());
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
		}
	}

	// ---------------- UPDATE PASSWORD ----------------

	@Override
	@Transactional
	public void updatePassword(PasswordUpdateRequest request) {

		Long loggedInUserId = SecurityUtils.getCurrentUserId();

		if (!loggedInUserId.equals(request.getUserId())) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can update only your own password");
		}

		User user = userRepository.findById(request.getUserId())
				.orElseThrow(() -> new ResourceNotFoundException(USER_NOT_FOUND));

		if (!passwordEncoder.matches(request.getOldPassword(), user.getPassword())) {

			auditLogService.logAction(user.getUserId(), ACTION_UPDATE_PASSWORD, RESOURCE_AUTH_SERVICE, STATUS_FAILED);

			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Old password is incorrect");
		}

		user.setPassword(passwordEncoder.encode(request.getNewPassword()));

		auditLogService.logAction(user.getUserId(), ACTION_UPDATE_PASSWORD, RESOURCE_AUTH_SERVICE, STATUS_SUCCESS);

		// ✅ Notification: Send private security alert
		String message = "Security Alert: Your password was successfully updated.";
		sendNotificationSafe(user.getUserId(), user.getUserId(), "Password Updated", message, "SECURITY");
	}

	// ---------------- RESET PASSWORD (ADMIN) ----------------

	@Override
	@Transactional
	public void resetPassword(PasswordResetRequest request) {

		User user = userRepository.findById(request.getUserId())
				.orElseThrow(() -> new ResourceNotFoundException(USER_NOT_FOUND));

		user.setPassword(passwordEncoder.encode(request.getNewPassword()));

		auditLogService.logAction(SecurityUtils.getCurrentUserId(), ACTION_RESET_PASSWORD, RESOURCE_AUTH_SERVICE,
				STATUS_SUCCESS);
		
		// ✅ Notification: Notify user that Admin reset their password
		String message = "Your password has been reset by an administrator.";
		sendNotificationSafe(user.getUserId(), user.getUserId(), "Password Reset", message, "SECURITY");
	}

	// ---------------- HELPERS ----------------

	// ✅ Private Helper Method for DTO-based Private Notification
	private void sendNotificationSafe(Long userId, Long entityId, String subject, String message, String category) {
		try {
			NotificationRequestDTO notificationReq = NotificationRequestDTO.builder()
					.userId(userId)        // Recipient ID
					.entityId(entityId)    // Related Entity ID (User ID in this context)
					.subject(subject)
					.message(message)
					.category(category)
					.build();

			notificationClient.createNotification(notificationReq);
			log.info("Private notification sent successfully to userId: {}", userId);
		} catch (Exception e) {
			// Fault-tolerance: Primary action succeeds even if notification fails
			log.error("Failed to push notification to NOTIFICATION-SERVICE for userId {}: {}", userId, e.getMessage());
		}
	}

	private UserResponse mapToUserResponse(User user) {
		UserResponse dto = new UserResponse();
		dto.setUserId(user.getUserId());
		dto.setName(user.getName());
		dto.setEmail(user.getEmail());

		dto.setRole(user.getRole());
		dto.setStatus(user.getStatus());

		dto.setPhone(user.getPhone());
		dto.setCreatedAt(user.getCreatedAt());
		dto.setUpdatedAt(user.getUpdatedAt());
		return dto;
	}

}