package com.tourismgov.event.dto;

import java.time.LocalDate;

import com.tourismgov.event.enums.ProgramStatus;

import lombok.Data;

@Data
public class ProgramDto {
    private Long programId;
    private String title;
    private LocalDate startDate;
    private LocalDate endDate;
    private ProgramStatus status;
}