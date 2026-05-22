package com.tourismgov.report.client;

import java.util.Collections;
import java.util.List;

import org.springframework.stereotype.Component;

import com.tourismgov.report.dto.ProgramDTO;

import lombok.extern.slf4j.Slf4j;

@Component
@Slf4j
public class ProgramClientFallback implements ProgramClient {

    @Override
    public List<ProgramDTO> getAllPrograms() {
        log.warn("FALLBACK: ProgramService unavailable. Returning empty programs list.");
        return Collections.emptyList();
    }
}
