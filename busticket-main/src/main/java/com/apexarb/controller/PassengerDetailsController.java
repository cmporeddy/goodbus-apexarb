package com.apexarb.controller;

import com.apexarb.entity.PassengerDetailsEntity;
import com.apexarb.model.ApiResponse;
import com.apexarb.service.PassengerDetailsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/**
 * Controller for managing PassengerDetails processing pipeline and fetching passenger records.
 */
@Slf4j
@RestController
@RequestMapping("/api/passenger-details")
@RequiredArgsConstructor
public class PassengerDetailsController {

    private final PassengerDetailsService passengerDetailsService;

    @PostMapping("/process")
    public ResponseEntity<ApiResponse> processPassengerDetails() {
        log.info("REST request to trigger PassengerDetails processing pipeline for today");
        List<PassengerDetailsEntity> processedRecords = passengerDetailsService.processPassengerDetailsForToday();
        int count = processedRecords != null ? processedRecords.size() : 0;
        return ResponseEntity.ok(ApiResponse.success(Map.of("processedCount", count), "Passenger details processed and saved successfully"));
    }

    @GetMapping
    public ResponseEntity<ApiResponse> getPassengerDetailsForToday() {
        log.info("REST request to fetch passenger details records for today");
        List<PassengerDetailsEntity> records = passengerDetailsService.getPassengerDetailsForToday();
        return ResponseEntity.ok(ApiResponse.success(records, "Fetched passenger details for today successfully"));
    }
}
