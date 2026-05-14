package com.tourismgov.program.service;

import com.tourismgov.program.entity.TourismProgram;
import com.tourismgov.program.enums.ProgramStatus;
import com.tourismgov.program.repository.TourismProgramRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class ProgramStatusScheduler {

    private final TourismProgramRepository programRepository;

    // Runs every day at midnight
    @Scheduled(cron = "0 0 0 * * *")
    @Transactional
    public void autoUpdateProgramStatuses() {
        LocalDate today = LocalDate.now();
        log.info("Running auto-status update for: {}", today);

        // 1. PLANNED -> ACTIVE (Start date is today or has passed)
        List<TourismProgram> toActivate = programRepository.findByStatusAndStartDateLessThanEqual(
                ProgramStatus.PLANNED, today);
        toActivate.forEach(p -> p.setStatus(ProgramStatus.ACTIVE));

        // 2. ACTIVE -> COMPLETED (End date was yesterday or earlier)
        List<TourismProgram> toComplete = programRepository.findByStatusAndEndDateBefore(
                ProgramStatus.ACTIVE, today);
        toComplete.forEach(p -> p.setStatus(ProgramStatus.COMPLETED));

        if (!toActivate.isEmpty() || !toComplete.isEmpty()) {
            programRepository.saveAll(toActivate);
            programRepository.saveAll(toComplete);
            log.info("Auto-updated: {} activated, {} completed.", toActivate.size(), toComplete.size());
        }
    }
}