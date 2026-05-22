package com.tourismgov.report.client;

import java.util.Collections;
import java.util.List;

import org.springframework.stereotype.Component;

import com.tourismgov.report.dto.BookingDTO;

import lombok.extern.slf4j.Slf4j;

@Component
@Slf4j
public class BookingClientFallback implements BookingClient {

    @Override
    public List<BookingDTO> getAllBookings() {
        log.warn("FALLBACK: EventBookingService unavailable. Returning empty bookings list.");
        return Collections.emptyList();
    }
}
