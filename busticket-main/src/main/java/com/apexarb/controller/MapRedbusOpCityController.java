package com.apexarb.controller;

import com.apexarb.entity.RedbusOpCityMapEntity;
import com.apexarb.model.ApiResponse;
import com.apexarb.model.MapRedbusCityRequest;
import com.apexarb.model.MapRedbusCityResultDto;
import com.apexarb.model.RedbusOpCityVerificationResultDto;
import com.apexarb.service.MapRedbusOpCityService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Controller for mapping Operator cities with RedBus cities.
 */
@Slf4j
@RestController
@RequestMapping("/api/map-redbus-cities")
@RequiredArgsConstructor
public class MapRedbusOpCityController {

    private final MapRedbusOpCityService mapRedbusOpCityService;

    @PostMapping
    public ResponseEntity<ApiResponse> mapOperatorCities(@RequestBody MapRedbusCityRequest request) {
        log.info("REST request to map operator cities with RedBus cities for operator: {}",
                request != null ? request.getOperatorId() : "null");
        MapRedbusCityResultDto result = mapRedbusOpCityService.mapCities(request);
        return ResponseEntity.ok(ApiResponse.success(result, "Operator and RedBus city mapping completed successfully"));
    }

    @GetMapping
    public ResponseEntity<ApiResponse> getAllMappedCities() {
        log.info("REST request to fetch all mapped RedBus cities");
        List<RedbusOpCityMapEntity> mappedCities = mapRedbusOpCityService.getAllMappedCities();
        return ResponseEntity.ok(ApiResponse.success(mappedCities, "Fetched all mapped RedBus cities successfully"));
    }

    @GetMapping("/filter")
    public ResponseEntity<ApiResponse> getMappedCityByOperatorIdAndOpCityId(
            @RequestParam("operator_id") String operatorId,
            @RequestParam("op_city_id") Long opCityId) {
        log.info("REST request to filter mapped RedBus city for operator_id: {} and op_city_id: {}", operatorId, opCityId);
        RedbusOpCityMapEntity mappedCity = mapRedbusOpCityService.getMappedCityByOperatorIdAndOpCityId(operatorId, opCityId);
        return ResponseEntity.ok(ApiResponse.success(mappedCity, "Fetched mapped RedBus city successfully"));
    }

    @GetMapping("/verify")
    public ResponseEntity<ApiResponse> verifyCityMappings(
            @RequestParam(value = "operator_id", required = false) String operatorIdSnake,
            @RequestParam(value = "operatorId", required = false) String operatorIdCamel) {
        String operatorId = StringUtils.hasText(operatorIdSnake) ? operatorIdSnake : operatorIdCamel;
        log.info("REST request to verify mapped RedBus cities for operatorId: {}", operatorId);
        RedbusOpCityVerificationResultDto result = mapRedbusOpCityService.verifyCityMappingsByOperatorId(operatorId);
        return ResponseEntity.ok(ApiResponse.success(result, "Verified RedBus city mappings successfully"));
    }
}

