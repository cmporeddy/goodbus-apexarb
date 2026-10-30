package com.apexarb.service.impl;

import com.apexarb.entity.RedbusOpCityMapEntity;
import com.apexarb.exception.ResourceNotFoundException;
import com.apexarb.model.MapRedbusCityRequest;
import com.apexarb.model.MapRedbusCityResultDto;
import com.apexarb.model.OperatorCityDto;
import com.apexarb.model.Operators;
import com.apexarb.model.RedbusCitiesResponse;
import com.apexarb.model.RedbusCityDto;
import com.apexarb.model.RedbusOpCityVerificationDto;
import com.apexarb.model.RedbusOpCityVerificationResultDto;
import com.apexarb.repository.RedbusOpCityMapRepository;
import com.apexarb.service.MapRedbusOpCityService;
import com.apexarb.service.OperatorService;
import com.apexarb.service.RedBusOAuthService;
import com.apexarb.util.AppConstants;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
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
public class MapRedbusOpCityServiceImpl implements MapRedbusOpCityService {

    private final OperatorService operatorService;
    private final RedBusOAuthService redBusOAuthService;
    private final RedbusOpCityMapRepository redbusOpCityMapRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final RestTemplate restTemplate = new RestTemplate();

    @Override
    @Transactional
    public MapRedbusCityResultDto mapCities(MapRedbusCityRequest request) {
        if (request == null || !StringUtils.hasText(request.getOperatorId())) {
            log.error("Invalid request: operatorId is required.");
            throw new IllegalArgumentException("operatorId is required in request payload.");
        }

        String operatorId = request.getOperatorId().trim();
        String operatorUrl = request.getOperatorUrl();
        String apiKey = request.getApiKey();

        log.info("Starting RedBus city mapping operation for operatorId: {}", operatorId);

        // Fallback to DB if operatorUrl or apiKey are missing
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
                log.warn("Could not fetch operator details from DB for operatorId: {}. Reason: {}", operatorId, e.getMessage());
            }
        }

        if (!StringUtils.hasText(operatorUrl)) {
            log.error("operatorUrl could not be determined for operatorId: {}. Cannot proceed.", operatorId);
            throw new IllegalArgumentException("operatorUrl is missing for operatorId: " + operatorId + ". Please provide operatorUrl in request.");
        }

        // 1. Fetch Operator Cities
        List<OperatorCityDto> operatorCities = fetchOperatorCities(operatorUrl, apiKey);
        log.info("Fetched {} cities for operator {}", operatorCities.size(), operatorId);

        // 2. Fetch RedBus Cities using RedBusOAuthService
        List<RedbusCityDto> redbusCities = fetchRedbusCities();
        log.info("Fetched {} RedBus cities", redbusCities.size());

        // Build lookup map for RedBus cities (normalized city name -> RedbusCityDto)
        Map<String, RedbusCityDto> redbusCityMap = new HashMap<>();
        for (RedbusCityDto redCity : redbusCities) {
            if (redCity != null && StringUtils.hasText(redCity.getName())) {
                redbusCityMap.put(redCity.getName().trim().toLowerCase(), redCity);
            }
        }

        List<OperatorCityDto> unmatchedCities = new ArrayList<>();
        int matchedCount = 0;

        // 3. Perform Matching & Persistence
        for (OperatorCityDto opCity : operatorCities) {
            if (opCity == null || !StringUtils.hasText(opCity.getName())) {
                continue;
            }

            String normalizedName = opCity.getName().trim().toLowerCase();
            if (redbusCityMap.containsKey(normalizedName)) {
                RedbusCityDto matchedRedCity = redbusCityMap.get(normalizedName);

                boolean exists = redbusOpCityMapRepository.existsByOperatorIdAndOpCityId(operatorId, opCity.getId());
                if (!exists) {
                    RedbusOpCityMapEntity entity = RedbusOpCityMapEntity.builder()
                            .operatorId(operatorId)
                            .opCityId(opCity.getId())
                            .redCityId(matchedRedCity.getId())
                            .name(opCity.getName())
                            .isActive("Y")
                            .build();

                    redbusOpCityMapRepository.save(entity);
                    log.debug("Mapped and saved: Operator City [{}: {}] -> RedBus City [{}: {}]",
                            opCity.getId(), opCity.getName(), matchedRedCity.getId(), matchedRedCity.getName());
                } else {
                    log.debug("Mapping already exists for operatorId: {}, opCityId: {}", operatorId, opCity.getId());
                }
                matchedCount++;
            } else {
                unmatchedCities.add(opCity);
            }
        }

        log.info("RedBus city mapping completed for operatorId: {}. Matched: {}, Unmatched: {}",
                operatorId, matchedCount, unmatchedCities.size());

        // 4. Save Unmatched Records to JSON File dynamically named {operator_id}.json
        String unmatchedFilePath = saveUnmatchedCitiesToJsonFile(operatorId, unmatchedCities);

        return MapRedbusCityResultDto.builder()
                .operatorId(operatorId)
                .operatorUrl(operatorUrl)
                .totalOperatorCities(operatorCities.size())
                .totalRedbusCities(redbusCities.size())
                .matchedCount(matchedCount)
                .unmatchedCount(unmatchedCities.size())
                .unmatchedFilePath(unmatchedFilePath)
                .unmatchedCities(unmatchedCities)
                .build();
    }

    private List<OperatorCityDto> fetchOperatorCities(String operatorUrl, String apiKey) {
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
        headers.set(HttpHeaders.USER_AGENT, "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
        headers.set(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE);

        HttpEntity<Void> requestEntity = new HttpEntity<>(headers);

        try {
            ResponseEntity<String> response = restTemplate.exchange(
                    fullUrl,
                    HttpMethod.GET,
                    requestEntity,
                    String.class);

            if (!StringUtils.hasText(response.getBody())) {
                log.warn("Received empty response body from operator cities endpoint: {}", fullUrl);
                return new ArrayList<>();
            }

            objectMapper.configure(com.fasterxml.jackson.databind.DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
            return objectMapper.readValue(response.getBody(), new com.fasterxml.jackson.core.type.TypeReference<List<OperatorCityDto>>() {});
        } catch (Exception e) {
            log.error("Failed to fetch cities from operator endpoint: {}. Error: {}", fullUrl, e.getMessage(), e);
            throw new RuntimeException("Failed to retrieve operator cities from " + sanitizeUrl(fullUrl) + ": " + e.getMessage(), e);
        }
    }

    private List<RedbusCityDto> fetchRedbusCities() {
        log.info("Fetching RedBus cities using RedBusOAuthService with URL: {}", AppConstants.CITIES_API_URL);
        try {
            ResponseEntity<String> response = redBusOAuthService.callRedBusApi(AppConstants.CITIES_API_URL);

            if (response == null || !StringUtils.hasText(response.getBody())) {
                log.warn("Received empty response body from RedBus OAuth service for cities API");
                return new ArrayList<>();
            }

            objectMapper.configure(com.fasterxml.jackson.databind.DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
            RedbusCitiesResponse parsedResponse = objectMapper.readValue(response.getBody(), RedbusCitiesResponse.class);

            if (parsedResponse == null || parsedResponse.getCities() == null) {
                log.warn("Received null cities list from RedBus cities API response");
                return new ArrayList<>();
            }
            return parsedResponse.getCities();
        } catch (Exception e) {
            log.error("Failed to fetch RedBus cities via RedBusOAuthService: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to retrieve RedBus cities: " + e.getMessage(), e);
        }
    }

    private String saveUnmatchedCitiesToJsonFile(String operatorId, List<OperatorCityDto> unmatchedCities) {
        String filename = operatorId + ".json";
        File resourcesDir = new File("src/main/resources");
        if (!resourcesDir.exists()) {
            resourcesDir.mkdirs();
        }

        File targetFile = new File(resourcesDir, filename);
        log.info("Writing unmatched operator cities to JSON file: {}", targetFile.getAbsolutePath());

        try {
            objectMapper.writerWithDefaultPrettyPrinter().writeValue(targetFile, unmatchedCities);
            log.info("Successfully wrote {} unmatched city records to {}", unmatchedCities.size(), targetFile.getAbsolutePath());

            // Sync to target/classes if present
            File targetClassesDir = new File("target/classes");
            if (targetClassesDir.exists() && targetClassesDir.isDirectory()) {
                File targetClassesFile = new File(targetClassesDir, filename);
                objectMapper.writerWithDefaultPrettyPrinter().writeValue(targetClassesFile, unmatchedCities);
                log.info("Synced unmatched city records to target/classes: {}", targetClassesFile.getAbsolutePath());
            }

            return targetFile.getAbsolutePath();
        } catch (IOException e) {
            log.error("Failed to write unmatched operator cities to JSON file for operatorId: {}. Error: {}", operatorId, e.getMessage(), e);
            throw new RuntimeException("Failed to write unmatched city records to JSON file " + filename + ": " + e.getMessage(), e);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<RedbusOpCityMapEntity> getAllMappedCities() {
        log.info("Fetching all mapped city records from redbus_op_city_map table");
        return redbusOpCityMapRepository.findAll();
    }

    @Override
    @Transactional(readOnly = true)
    public RedbusOpCityMapEntity getMappedCityByOperatorIdAndOpCityId(String operatorId, Long opCityId) {
        log.info("Fetching mapped city record for operatorId: {} and opCityId: {}", operatorId, opCityId);
        return redbusOpCityMapRepository.findByOperatorIdAndOpCityId(operatorId, opCityId)
                .orElseThrow(() -> {
                    log.warn("Mapped city record not found for operatorId: {} and opCityId: {}", operatorId, opCityId);
                    return new ResourceNotFoundException("Mapped city record not found for operatorId: " + operatorId + " and opCityId: " + opCityId);
                });
    }

    @Override
    @Transactional(readOnly = true)
    public RedbusOpCityVerificationResultDto verifyCityMappingsByOperatorId(String operatorId) {
        if (!StringUtils.hasText(operatorId)) {
            log.error("Invalid verification request: operatorId is required.");
            throw new IllegalArgumentException("operatorId parameter is required.");
        }

        String cleanOperatorId = operatorId.trim();
        log.info("Starting verification of RedBus city mappings for operatorId: {}", cleanOperatorId);

        // 1. Fetch mapped entities for operatorId
        List<RedbusOpCityMapEntity> mappedRecords = redbusOpCityMapRepository.findByOperatorId(cleanOperatorId);
        log.info("Found {} mapped records in DB for operatorId: {}", mappedRecords.size(), cleanOperatorId);

        // 2. Build Operator City lookup map (opCityId -> operatorCityName)
        Map<Long, String> opCityIdToNameMap = new HashMap<>();
        try {
            Operators op = operatorService.getOperatorByOperatorId(cleanOperatorId);
            if (op != null && StringUtils.hasText(op.getOperatorUrl())) {
                List<OperatorCityDto> opCities = fetchOperatorCities(op.getOperatorUrl(), op.getApiKey());
                for (OperatorCityDto opCity : opCities) {
                    if (opCity != null && opCity.getId() != null && StringUtils.hasText(opCity.getName())) {
                        opCityIdToNameMap.put(opCity.getId(), opCity.getName().trim());
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Could not fetch operator cities list for verification for operatorId: {}. Error: {}", cleanOperatorId, e.getMessage());
        }

        // 3. Build RedBus City lookup map (redCityId -> redbusCityName)
        Map<String, String> redbusCityIdToNameMap = new HashMap<>();
        try {
            List<RedbusCityDto> redbusCities = fetchRedbusCities();
            for (RedbusCityDto redCity : redbusCities) {
                if (redCity != null && StringUtils.hasText(redCity.getId()) && StringUtils.hasText(redCity.getName())) {
                    redbusCityIdToNameMap.put(redCity.getId().trim(), redCity.getName().trim());
                }
            }
        } catch (Exception e) {
            log.warn("Could not fetch RedBus cities list for verification. Error: {}", e.getMessage());
        }

        List<RedbusOpCityVerificationDto> verificationList = new ArrayList<>();
        int matchedCount = 0;
        int mismatchedCount = 0;

        // 4. Verify each record
        for (RedbusOpCityMapEntity entity : mappedRecords) {
            String opCityName = opCityIdToNameMap.get(entity.getOpCityId());
            if (!StringUtils.hasText(opCityName)) {
                // Fallback to stored name in entity if op city not found in live API list
                opCityName = entity.getName();
            }

            String redbusCityName = redbusCityIdToNameMap.get(entity.getRedCityId());
            if (!StringUtils.hasText(redbusCityName)) {
                redbusCityName = "Unknown / Not Found";
            }

            boolean isMatch = StringUtils.hasText(opCityName)
                    && StringUtils.hasText(redbusCityName)
                    && opCityName.trim().equalsIgnoreCase(redbusCityName.trim());

            String status;
            if ("Unknown / Not Found".equals(redbusCityName)) {
                status = "RED_CITY_NOT_FOUND";
            } else if (isMatch) {
                status = "MATCHED";
                matchedCount++;
            } else {
                status = "MISMATCHED";
                mismatchedCount++;
            }

            RedbusOpCityVerificationDto dto = RedbusOpCityVerificationDto.builder()
                    .id(entity.getId())
                    .operatorId(entity.getOperatorId())
                    .opCityId(entity.getOpCityId())
                    .operatorCityName(opCityName)
                    .redCityId(entity.getRedCityId())
                    .redbusCityName(redbusCityName)
                    .isMatch(isMatch)
                    .status(status)
                    .isActive(entity.getIsActive())
                    .build();

            verificationList.add(dto);
        }

        log.info("Completed verification for operatorId: {}. Total: {}, Matched: {}, Mismatched: {}",
                cleanOperatorId, mappedRecords.size(), matchedCount, mismatchedCount);

        return RedbusOpCityVerificationResultDto.builder()
                .operatorId(cleanOperatorId)
                .totalMappings(mappedRecords.size())
                .matchedCount(matchedCount)
                .mismatchedCount(mismatchedCount)
                .mappings(verificationList)
                .build();
    }


    private String sanitizeUrl(String url) {
        if (url == null) {
            return null;
        }
        return url.replaceAll("(?i)([?&]api_key=)[^&]*", "$1*****");
    }
}
