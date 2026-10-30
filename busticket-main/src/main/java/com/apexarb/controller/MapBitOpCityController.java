package com.apexarb.controller;

import com.apexarb.entity.BitOpCityMapEntity;
import com.apexarb.model.ApiResponse;
import com.apexarb.model.MapCityRequest;
import com.apexarb.model.MapCityResultDto;
import com.apexarb.service.MapBitOpCityService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller for mapping Operator cities with BIT cities.
 */
@Slf4j
@RestController
@RequestMapping("/api/map-cities")
@RequiredArgsConstructor
public class MapBitOpCityController {

    private final MapBitOpCityService mapBitOpCityService;

    @PostMapping
    public ResponseEntity<ApiResponse> mapOperatorCities(@RequestBody MapCityRequest request) {
        log.info("REST request to map cities for operator: {}", request != null ? request.getOperatorId() : "null");
        MapCityResultDto result = mapBitOpCityService.mapCities(request);
        return ResponseEntity.ok(ApiResponse.success(result, "Operator city mapping completed successfully"));
    }

    @GetMapping
    public ResponseEntity<ApiResponse> getAllMappedCities() {
        log.info("REST request to fetch all mapped cities");
        List<BitOpCityMapEntity> mappedCities = mapBitOpCityService.getAllMappedCities();
        return ResponseEntity.ok(ApiResponse.success(mappedCities, "Fetched all mapped cities successfully"));
    }

    @GetMapping("/filter")
    public ResponseEntity<ApiResponse> getMappedCityByOperatorIdAndBitId(
            @RequestParam("operator_id") String operatorId,
            @RequestParam("bit_id") Long bitId) {
        log.info("REST request to filter mapped city for operator_id: {} and bit_id: {}", operatorId, bitId);
        BitOpCityMapEntity mappedCity = mapBitOpCityService.getMappedCityByOperatorIdAndBitCityId(operatorId, bitId);
        return ResponseEntity.ok(ApiResponse.success(mappedCity, "Fetched mapped city successfully"));
    }

}
