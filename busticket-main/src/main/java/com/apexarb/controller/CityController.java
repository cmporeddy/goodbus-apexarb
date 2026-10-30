package com.apexarb.controller;

import com.apexarb.model.ApiResponse;
import com.apexarb.model.CityDto;
import com.apexarb.service.CityService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Controller to handle fetching and managing city data cached from TicketSimply API
 */
@Slf4j
@RestController
@RequestMapping("/api/cities")
@RequiredArgsConstructor
public class CityController {

    private final CityService cityService;

    @GetMapping
    public ResponseEntity<ApiResponse> getCities() {
        log.info("REST request to fetch cities list");
        List<CityDto> cities = cityService.getCities();
        return ResponseEntity.ok(ApiResponse.success(cities, "Fetched cities successfully"));
    }

    @PostMapping("/refresh-cache")
    public ResponseEntity<ApiResponse> refreshCitiesCache() {
        log.info("REST request to manually refresh cities cache");
        List<CityDto> freshCities = cityService.refreshCitiesCache();
        return ResponseEntity.ok(ApiResponse.success(freshCities, "Cities cache refreshed successfully"));
    }
}
