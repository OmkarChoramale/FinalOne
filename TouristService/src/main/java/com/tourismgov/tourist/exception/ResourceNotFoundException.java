package com.tourismgov.tourist.exception;

/**
 * ResourceNotFoundException - thrown when a record is not found in DB.
 *
 * Examples:
 *   - User not found with given ID
 *   - Notification not found with given ID
 *
 * Extends RuntimeException so we don't need try-catch everywhere.
 * GlobalExceptionHandler catches this and returns 404 response.
 */
public class ResourceNotFoundException extends RuntimeException {

    /**
	 * 
	 */
	private static final long serialVersionUID = 1L;



	// Constructor with custom message
    public ResourceNotFoundException(String message) {
        super(message);
    }
    
    

    // Constructor with resource name and ID - builds readable message
    public ResourceNotFoundException(String resourceName, Long id) {
        super(resourceName + " not found with id: " + id);
    }
}
