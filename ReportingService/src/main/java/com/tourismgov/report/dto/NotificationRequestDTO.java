package com.tourismgov.report.dto; // Adjust package name based on the specific service

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationRequestDTO {
    private Long notificationId;
    private Long userId;     // The Recipient ID (or Sender ID for broadcasts)
    private String userName; // Optional metadata
    private Long entityId;   // Related ID (BookingId, EventId, ReportId, etc.)
    private String subject;
    private String message;
    private String category; // e.g., "SYSTEM", "SECURITY", "EVENT", "DOCUMENT"
    private String status;   // e.g., "UNREAD", "READ"
    private LocalDateTime createdDate;
}