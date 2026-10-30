package com.apexarb.service.impl;

import com.apexarb.entity.BitOpCityMapEntity;
import com.apexarb.model.CityDto;
import com.apexarb.model.MapCityRequest;
import com.apexarb.model.MapCityResultDto;
import com.apexarb.model.OperatorCityDto;
import com.apexarb.model.Operators;
import com.apexarb.repository.BitOpCityMapRepository;
import com.apexarb.service.CityService;
import com.apexarb.service.MapBitOpCityService;
import com.apexarb.service.OperatorService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class MapBitOpCityServiceImpl implements MapBitOpCityService {

    private final CityService cityService;
    private final OperatorService operatorService;
    private final BitOpCityMapRepository bitOpCityMapRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final RestTemplate restTemplate = new RestTemplate();

    @Override
    @Transactional
    public MapCityResultDto mapCities(MapCityRequest request) {
        if (request == null || !StringUtils.hasText(request.getOperatorId())) {
            log.error("Invalid request: operatorId is required.");
            throw new IllegalArgumentException("operatorId is required in request body.");
        }

        String operatorId = request.getOperatorId().trim();
        String operatorUrl = request.getOperatorUrl();
        String apiKey = request.getApiKey();

        log.info("Starting city mapping operation for operatorId: {}", operatorId);

        // Fallback to database if operatorUrl or apiKey are missing
        if (!StringUtils.hasText(operatorUrl) || !StringUtils.hasText(apiKey)) {
            log.info("Fetching operator details from DB for operatorId: {}", operatorId);
            try {
                Operators op = operatorService.getOperatorByOperatorId(operatorId);
                if (op != null) {
                    if (!StringUtils.hasText(operatorUrl)) {
                        operatorUrl = op.getOperatorUrl();
                    }
                    if (!StringUtils.hasText(apiKey)) {
                        apiKey = op.getApiKey();
                    }
                }
            } catch (Exception e) {
                log.warn("Could not fetch operator details from DB for operatorId: {}. Reason: {}", operatorId,
                        e.getMessage());
            }
        }

        if (!StringUtils.hasText(operatorUrl)) {
            log.error("operatorUrl could not be determined for operatorId: {}. Cannot proceed.", operatorId);
            throw new IllegalArgumentException("operatorUrl is missing for operatorId: " + operatorId
                    + ". Please provide operatorUrl in request.");
        }

        // 1. Fetch Operator Cities
        List<OperatorCityDto> operatorCities = fetchOperatorCities(operatorUrl, apiKey);
        log.info("Fetched {} cities for operator {}", operatorCities.size(), operatorId);

        // 2. Fetch BIT Cities
        List<CityDto> bitCities = cityService.getCities();
        log.info("Fetched {} BIT (X) cities", bitCities.size());

        // Build lookup map for BIT cities (normalized name -> CityDto)
        Map<String, CityDto> bitCityNameMap = new HashMap<>();
        for (CityDto city : bitCities) {
            if (city != null && StringUtils.hasText(city.getName())) {
                bitCityNameMap.put(city.getName().trim().toLowerCase(), city);
            }
        }

        List<OperatorCityDto> unmatchedCities = new ArrayList<>();
        int matchedCount = 0;

        // 3. Perform Matching & DB Persistence
        for (OperatorCityDto opCity : operatorCities) {
            if (opCity == null || !StringUtils.hasText(opCity.getName())) {
                continue;
            }

            String normalizedName = opCity.getName().trim().toLowerCase();
            if (bitCityNameMap.containsKey(normalizedName)) {
                CityDto matchedBitCity = bitCityNameMap.get(normalizedName);

                // Check if mapping already exists to prevent duplicate inserts
                boolean exists = bitOpCityMapRepository.existsByOperatorIdAndOpCityId(operatorId, opCity.getId());
                if (!exists) {
                    BitOpCityMapEntity entity = BitOpCityMapEntity.builder()
                            .operatorId(operatorId)
                            .bitCityId(matchedBitCity.getId())
                            .opCityId(opCity.getId())
                            .name(opCity.getName())
                            .build();

                    bitOpCityMapRepository.save(entity);
                    log.debug("Mapped and saved: Operator City [{}: {}] -> BIT City [{}: {}]",
                            opCity.getId(), opCity.getName(), matchedBitCity.getId(), matchedBitCity.getName());
                } else {
                    log.debug("Mapping already exists for operatorId: {}, opCityId: {}", operatorId, opCity.getId());
                }
                matchedCount++;
            } else {
                unmatchedCities.add(opCity);
            }
        }

        log.info("City mapping completed for operatorId: {}. Matched: {}, Unmatched: {}",
                operatorId, matchedCount, unmatchedCities.size());

        // 4. Save Unmatched Records to JSON File in resources folder
        String unmatchedFilePath = saveUnmatchedCitiesToJsonFile(operatorId, unmatchedCities);

        return MapCityResultDto.builder()
                .operatorId(operatorId)
                .operatorUrl(operatorUrl)
                .totalOperatorCities(operatorCities.size())
                .matchedCount(matchedCount)
                .unmatchedCount(unmatchedCities.size())
                .unmatchedFilePath(unmatchedFilePath)
                .unmatchedCities(unmatchedCities)
                .build();
    }

    private List<OperatorCityDto> fetchOperatorCities(String operatorUrl, String apiKey) {
        // Ensure protocol prefix and upgrade to HTTPS
        String cleanUrl = operatorUrl.trim();
        if (cleanUrl.startsWith("http://")) {
            cleanUrl = "https://" + cleanUrl.substring(7);
        } else if (!cleanUrl.startsWith("https://")) {
            cleanUrl = "https://" + cleanUrl;
        }
        if (cleanUrl.endsWith("/")) {
            cleanUrl = cleanUrl.substring(0, cleanUrl.length() - 1);
        }

        UriComponentsBuilder uriBuilder = UriComponentsBuilder.fromUriString(cleanUrl + "/api/cities.json");
        if (StringUtils.hasText(apiKey)) {
            uriBuilder.queryParam("api_key", apiKey);
        }
        String fullUrl = uriBuilder.build().toUriString();

        log.info("Sending GET request to operator cities endpoint: {}", sanitizeUrl(fullUrl));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Void> requestEntity = new HttpEntity<>(headers);

        try {
            ResponseEntity<List<OperatorCityDto>> response = restTemplate.exchange(
                    fullUrl,
                    HttpMethod.GET,
                    requestEntity,
                    new ParameterizedTypeReference<List<OperatorCityDto>>() {
                    });

            if (response.getBody() == null) {
                log.warn("Received empty response body from operator cities endpoint: {}", fullUrl);
                return new ArrayList<>();
            }
            return response.getBody();
        } catch (RestClientException rce) {
            log.error("Failed to fetch cities from operator endpoint: {}. Error: {}", fullUrl, rce.getMessage(), rce);
            throw new RuntimeException(
                    "When calling endpoint " + fullUrl + ", failed to retrieve operator cities: " + rce.getMessage(),
                    rce);
        }
    }

    private String saveUnmatchedCitiesToJsonFile(String operatorId, List<OperatorCityDto> unmatchedCities) {
        String filename = operatorId + ".json";
        File resourcesDir = new File("src/main/resources");
        if (!resourcesDir.exists()) {
            resourcesDir.mkdirs();
        }

        File targetFile = new File(resourcesDir, filename);
        log.info("Writing unmatched operator cities to file: {}", targetFile.getAbsolutePath());

        try {
            objectMapper.writerWithDefaultPrettyPrinter().writeValue(targetFile, unmatchedCities);
            log.info("Successfully wrote {} unmatched city records to {}", unmatchedCities.size(),
                    targetFile.getAbsolutePath());

            // Also copy to target/classes if present for immediate classpath visibility
            File targetClassesDir = new File("target/classes");
            if (targetClassesDir.exists() && targetClassesDir.isDirectory()) {
                File targetClassesFile = new File(targetClassesDir, filename);
                objectMapper.writerWithDefaultPrettyPrinter().writeValue(targetClassesFile, unmatchedCities);
                log.info("Also synced unmatched city records to target/classes: {}",
                        targetClassesFile.getAbsolutePath());
            }

            return targetFile.getAbsolutePath();
        } catch (IOException e) {
            log.error("Failed to write unmatched operator cities to JSON file for operatorId: {}. Error: {}",
                    operatorId, e.getMessage(), e);
            throw new RuntimeException(
                    "Failed to write unmatched city records to JSON file " + filename + ": " + e.getMessage(), e);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<BitOpCityMapEntity> getAllMappedCities() {
        log.info("Fetching all mapped city records from Bit_OP_City_Map table");
        List<BitOpCityMapEntity> records = bitOpCityMapRepository.findAll();
        log.info("Successfully fetched {} mapped city records from DB", records.size());
        return records;
    }

    @Override
    @Transactional(readOnly = true)
    public BitOpCityMapEntity getMappedCityByOperatorIdAndBitCityId(String operatorId, Long bitCityId) {
        log.info("Fetching mapped city record for operatorId: {} and bitCityId: {}", operatorId, bitCityId);
        return bitOpCityMapRepository.findByOperatorIdAndBitCityId(operatorId, bitCityId)
                .orElseThrow(() -> {
                    log.warn("Mapped city record not found for operatorId: {} and bitCityId: {}", operatorId,
                            bitCityId);
                    return new com.apexarb.exception.ResourceNotFoundException(
                            "Mapped city record not found for operatorId: " + operatorId + " and bitCityId: "
                                    + bitCityId);
                });
    }

    private String sanitizeUrl(String url) {
        if (url == null) {
            return null;
        }
        return url.replaceAll("(?i)([?&]api_key=)[^&]*", "$1*****");
    }
}
