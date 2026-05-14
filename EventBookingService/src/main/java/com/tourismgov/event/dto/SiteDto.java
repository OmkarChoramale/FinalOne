package com.tourismgov.event.dto;

import com.tourismgov.event.enums.SiteStatus;

import lombok.Data;

@Data
public class SiteDto {
    private Long siteId;
    private String name;
    private SiteStatus status;
}