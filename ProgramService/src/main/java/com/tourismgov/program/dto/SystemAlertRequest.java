package com.tourismgov.program.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SystemAlertRequest {
    private Long userId;
    private Long entityId;
    private String subject;
    private String message;
    private String category;
}