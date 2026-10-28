package com.apexarb.service.impl;

import com.apexarb.entity.BitOpCityMapEntity;
import com.apexarb.entity.PassengerDetailsEntity;
import com.apexarb.entity.ProcessedRouteEntity;
import com.apexarb.model.Operators;
import com.apexarb.repository.PassengerDetailsRepository;
import com.apexarb.repository.ProcessedRouteRepository;
import com.apexarb.service.MapBitOpCityService;
import com.apexarb.service.OperatorService;
import com.apexarb.service.PassengerDetailsService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;

import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.zip.GZIPInputStream;
import java.util.zip.Inflater;
import java.util.zip.InflaterInputStream;

@Slf4j
@Service
@RequiredArgsConstructor
public class PassengerDetailsServiceImpl implements PassengerDetailsService {

    private final OperatorService operatorService;
    private final MapBitOpCityService mapBitOpCityService;
    private final PassengerDetailsRepository passengerDetailsRepository;
    private final ProcessedRouteRepository processedRouteRepository;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${ticketsimply.api.min-available-seats:1}")
    private int minAvailableSeats;

    @Value("${ticketsimply.api.max-available-seats:6}")
    private int maxAvailableSeats;

    @Value("${ticketsimply.api.api-key:TSDBNGAPI30025020}")
    private String globalApiKey;

    @Override
    @Transactional
    public List<PassengerDetailsEntity> processPassengerDetailsForToday() {
        String todayDate = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd"));
        log.info("Starting PassengerDetails processing pipeline for travel_date: {}", todayDate);

        List<Operators> operators = operatorService.getAllOperators();
        if (operators == null || operators.isEmpty()) {
            log.error("No operators returned from operatorService.getAllOperators(), cannot proceed further.");
            throw new IllegalStateException(
                    "No operators found in database. Cannot proceed with passenger details processing.");
        }

        List<PassengerDetailsEntity> savedRecords = new ArrayList<>();
        Set<String> processedRoutesInBatch = new HashSet<>();

        for (Operators operator : operators) {
            if (operator == null || !StringUtils.hasText(operator.getOperatorId())) {
                log.warn("Skipping invalid operator record without operatorId: {}", operator);
                continue;
            }

            String travelId = operator.getOperatorId().trim();
            String operatorUrl = operator.getOperatorUrl();
            String apiKey = StringUtils.hasText(operator.getApiKey()) ? operator.getApiKey().trim() : globalApiKey;

            log.info("Processing schedules for operatorId: {}, name: {}", travelId, operator.getName());

            // Step 1: Call Operator Schedules API for today
            List<Map<String, Object>> rawSchedules = fetchOperatorSchedules(travelId, todayDate);
            if (rawSchedules == null || rawSchedules.isEmpty()) {
                log.info("No schedules returned for operatorId: {} on date: {}", travelId, todayDate);
                continue;
            }

            // Group rawSchedules by unique route_id (Condition 1: route_id should be
            // unique)
            Map<String, List<Map<String, Object>>> schedulesByRouteId = new HashMap<>();
            for (Map<String, Object> item : rawSchedules) {
                String routeId = getStringField(item, "route_id");
                if (StringUtils.hasText(routeId)) {
                    schedulesByRouteId.computeIfAbsent(routeId.trim(), k -> new ArrayList<>()).add(item);
                }
            }

            // Process each unique route_id
            for (Map.Entry<String, List<Map<String, Object>>> entry : schedulesByRouteId.entrySet()) {
                String routeId = entry.getKey();
                List<Map<String, Object>> routeItems = entry.getValue();

                try {
                    // Condition 1: route_id should be unique for today (check DB & current batch
                    // set)
                    if (processedRoutesInBatch.contains(routeId)
                            || processedRouteRepository.existsByRouteIdAndTravelDate(routeId, todayDate)) {
                        log.debug("Route ID '{}' already processed for travel_date '{}'. Skipping duplicate.", routeId,
                                todayDate);
                        continue;
                    }

                    // Filter with id: Select ONLY the record with the largest numeric 'id' (latest
                    // record)
                    Map<String, Object> latestItem = selectRecordWithLargestId(routeItems);
                    if (latestItem == null) {
                        continue;
                    }

                    // Validate mandatory fields on the selected latest record
                    String opScheduleId = getStringField(latestItem, "op_schedule_id");
                    Long originId = getLongField(latestItem, "origin_id");
                    Long destinationId = getLongField(latestItem, "destination_id");
                    Integer availableSeats = getIntegerField(latestItem, "available_seats");
                    String status = getStringField(latestItem, "status");
                    String travelDate = getStringField(latestItem, "travel_date");
                    if (!StringUtils.hasText(travelDate)) {
                        travelDate = todayDate;
                    }

                    if (!StringUtils.hasText(opScheduleId)) {
                        log.error(
                                "When calling operator schedules API for operatorId: {}, field 'op_schedule_id' is missing in latest record for route_id: {}",
                                travelId, routeId);
                        continue;
                    }
                    if (originId == null) {
                        log.error(
                                "When calling operator schedules API for operatorId: {}, field 'origin_id' is missing in latest record for op_schedule_id: {}",
                                travelId, opScheduleId);
                        continue;
                    }
                    if (destinationId == null) {
                        log.error(
                                "When calling operator schedules API for operatorId: {}, field 'destination_id' is missing in latest record for op_schedule_id: {}",
                                travelId, opScheduleId);
                        continue;
                    }
                    if (availableSeats == null) {
                        log.error(
                                "When calling operator schedules API for operatorId: {}, field 'available_seats' is missing in latest record for op_schedule_id: {}",
                                travelId, opScheduleId);
                        continue;
                    }
                    if (!StringUtils.hasText(status)) {
                        log.error(
                                "When calling operator schedules API for operatorId: {}, field 'status' is missing in latest record for op_schedule_id: {}",
                                travelId, opScheduleId);
                        continue;
                    }

                    // Condition 2: available_seats > 0 and <= maxAvailableSeats (configured in
                    // application.yml)
                    if (availableSeats < minAvailableSeats || availableSeats > maxAvailableSeats) {
                        log.debug(
                                "Route ID: {}, op_schedule_id: {} with availableSeats: {} outside range [{}-{}]. Skipping.",
                                routeId, opScheduleId, availableSeats, minAvailableSeats, maxAvailableSeats);
                        continue;
                    }

                    // Condition 3: status should be "update"
                    if (!"update".equalsIgnoreCase(status.trim())) {
                        log.debug("Route ID: {}, op_schedule_id: {} with status: '{}' is not 'update'. Skipping.",
                                opScheduleId, status);
                        continue;
                    }

                    // Condition 4: travel_date should be today's date
                    if (!todayDate.equalsIgnoreCase(travelDate.trim())) {
                        log.debug(
                                "Route ID: {}, op_schedule_id: {} travel_date '{}' does not match today '{}'. Skipping.",
                                routeId, opScheduleId, travelDate, todayDate);
                        continue;
                    }

                    // Step 3: Resolve operator city IDs using mapBitOpCityService
                    Long originOpCityId;
                    Long destinationOpCityId;
                    try {
                        BitOpCityMapEntity originMap = mapBitOpCityService
                                .getMappedCityByOperatorIdAndBitCityId(travelId, originId);
                        originOpCityId = originMap.getOpCityId();

                        BitOpCityMapEntity destMap = mapBitOpCityService.getMappedCityByOperatorIdAndBitCityId(travelId,
                                destinationId);
                        destinationOpCityId = destMap.getOpCityId();
                    } catch (Exception e) {
                        log.error(
                                "When mapping city IDs for operatorId: {}, origin_id: {}, destination_id: {}, record was not found in Bit_OP_City_Map table so cannot proceed further for op_schedule_id: {}. Reason: {}",
                                travelId, originId, destinationId, opScheduleId, e.getMessage());
                        continue;
                    }

                    // Step 4: Call operator service_details API
                    if (!StringUtils.hasText(operatorUrl)) {
                        log.error(
                                "When calling service details API, operator_url is missing for operatorId: {} so cannot proceed further",
                                travelId);
                        continue;
                    }

                    List<PassengerDetailsEntity> entities = fetchServiceDetailsAndMapEntities(
                            operatorUrl, apiKey, opScheduleId, originOpCityId, destinationOpCityId, travelId, routeId);

                    if (entities != null && !entities.isEmpty()) {
                        List<PassengerDetailsEntity> savedList = passengerDetailsRepository.saveAll(entities);

                        // Save processed route record to prevent duplicate processing for remainder of
                        // day
                        ProcessedRouteEntity processedRoute = ProcessedRouteEntity.builder()
                                .routeId(routeId)
                                .travelDate(todayDate)
                                .opScheduleId(opScheduleId)
                                .operatorId(travelId)
                                .build();
                        processedRouteRepository.save(processedRoute);
                        processedRoutesInBatch.add(routeId);

                        savedRecords.addAll(savedList);
                        log.info(
                                "Successfully processed and saved {} passenger details for routeId: {}, op_schedule_id: {}",
                                savedList.size(), routeId, opScheduleId);
                    }

                } catch (Exception ex) {
                    log.error("Unexpected error during processing routeId: {}. Error: {}", routeId, ex.getMessage(),
                            ex);
                }
            }
        }

        log.info("PassengerDetails processing completed for today. Saved {} records.", savedRecords.size());
        return savedRecords;
    }

    @Override
    @Transactional(readOnly = true)
    public List<PassengerDetailsEntity> getPassengerDetailsForToday() {
        String todayDate = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd"));
        log.info("Fetching passenger details records for today's date: {}", todayDate);
        return passengerDetailsRepository.findByTravelDate(todayDate);
    }

    /**
     * Scheduled job running hourly from 09:00 AM to 10:00 PM.
     */
    @Scheduled(cron = "${ticketsimply.api.schedule-cron:0 0 9-22 * * *}")
    public void scheduledProcessing() {
        log.info("Triggering scheduled PassengerDetails processing job...");
        try {
            List<PassengerDetailsEntity> results = processPassengerDetailsForToday();
            log.info("Scheduled PassengerDetails processing completed successfully. Processed {} records.",
                    results.size());
        } catch (Exception e) {
            log.error("Failed scheduled hourly PassengerDetails processing job: {}", e.getMessage(), e);
        }
    }

    private List<Map<String, Object>> fetchOperatorSchedules(String travelId, String travelDate) {
        String url = String.format("https://gds.ticketsimply.com/gds/api/operator_schedules/%s/%s.json", travelId,
                travelDate);
        String fullUrl = UriComponentsBuilder.fromUriString(url)
                .queryParam("api_key", globalApiKey)
                .build()
                .toUriString();

        log.info("Sending GET request to operator schedules API: {}", sanitizeUrl(fullUrl));
        String jsonString = executeDecompressedGet(fullUrl);
        if (!StringUtils.hasText(jsonString)) {
            log.warn("Received empty or null response body from operator schedules API: {}", sanitizeUrl(fullUrl));
            return new ArrayList<>();
        }

        List<Map<String, Object>> scheduleMaps = new ArrayList<>();
        try {
            JsonNode rootNode = objectMapper.readTree(jsonString);

            // Check if 2D array structure inside "result"
            if (rootNode.has("result") && rootNode.get("result").isArray()) {
                JsonNode resultNode = rootNode.get("result");
                if (resultNode.size() > 1) {
                    // Header row at index 0
                    List<String> headersList = new ArrayList<>();
                    JsonNode headerRow = resultNode.get(0);
                    for (JsonNode col : headerRow) {
                        headersList.add(col.asText());
                    }

                    // Data rows at index 1..N
                    for (int i = 1; i < resultNode.size(); i++) {
                        JsonNode dataRow = resultNode.get(i);
                        Map<String, Object> map = new HashMap<>();
                        for (int colIdx = 0; colIdx < headersList.size() && colIdx < dataRow.size(); colIdx++) {
                            String colName = headersList.get(colIdx);
                            JsonNode valNode = dataRow.get(colIdx);
                            if (valNode.isNumber()) {
                                map.put(colName, valNode.numberValue());
                            } else if (valNode.isBoolean()) {
                                map.put(colName, valNode.booleanValue());
                            } else if (!valNode.isNull()) {
                                map.put(colName, valNode.asText());
                            } else {
                                map.put(colName, null);
                            }
                        }
                        scheduleMaps.add(map);
                    }
                    log.info("Parsed {} schedule 2D rows for operatorId: {}", scheduleMaps.size(), travelId);
                    return scheduleMaps;
                }
            } else if (rootNode.isArray()) {
                for (JsonNode item : rootNode) {
                    if (item.isObject()) {
                        scheduleMaps.add(objectMapper.convertValue(item, new TypeReference<Map<String, Object>>() {
                        }));
                    }
                }
                return scheduleMaps;
            }

            log.warn("Unexpected schedule response format from URL {}: {}", sanitizeUrl(fullUrl), jsonString);
            return new ArrayList<>();
        } catch (Exception e) {
            log.error("Failed to parse operator schedules JSON from endpoint {}: {}", sanitizeUrl(fullUrl), e.getMessage(), e);
            return new ArrayList<>();
        }
    }

    @SuppressWarnings("unchecked")
    private List<PassengerDetailsEntity> fetchServiceDetailsAndMapEntities(
            String operatorUrl, String apiKey, String opScheduleId, Long originOpCityId, Long destinationOpCityId,
            String operatorId, String routeId) {

        List<PassengerDetailsEntity> entities = new ArrayList<>();

        String cleanUrl = operatorUrl.trim();
        if (cleanUrl.startsWith("http://")) {
            cleanUrl = "https://" + cleanUrl.substring(7);
        } else if (!cleanUrl.startsWith("https://")) {
            cleanUrl = "https://" + cleanUrl;
        }
        if (cleanUrl.endsWith("/")) {
            cleanUrl = cleanUrl.substring(0, cleanUrl.length() - 1);
        }

        String fullUrl = UriComponentsBuilder.fromUriString(cleanUrl + "/api/service_details.json")
                .queryParam("id", opScheduleId)
                .queryParam("origin_id", originOpCityId)
                .queryParam("destination_id", destinationOpCityId)
                .queryParam("api_key", apiKey)
                .build()
                .toUriString();

        log.info("Sending GET request to service details endpoint: {}", sanitizeUrl(fullUrl));
        String jsonString = executeDecompressedGet(fullUrl);
        if (!StringUtils.hasText(jsonString) || jsonString.trim().startsWith("<")) {
            log.error(
                    "When calling endpoint {}, response body is empty, HTML, or invalid JSON so cannot proceed further",
                    sanitizeUrl(fullUrl));
            return entities;
        }

        try {
            Map<String, Object> rootMap = objectMapper.readValue(jsonString, new TypeReference<Map<String, Object>>() {
            });

            List<Map<String, Object>> rawPassengerMaps = new ArrayList<>();

            // 1. Direct root check (if API returns passenger_details at root)
            if (rootMap.containsKey("passenger_details") && rootMap.get("passenger_details") instanceof Map) {
                rawPassengerMaps.add((Map<String, Object>) rootMap.get("passenger_details"));
            }

            // 2. coach_details -> seat_details check (extract passenger_details from all
            // booked seats)
            if (rootMap.containsKey("coach_details") && rootMap.get("coach_details") instanceof Map) {
                Map<String, Object> coachDetails = (Map<String, Object>) rootMap.get("coach_details");
                if (coachDetails.containsKey("seat_details") && coachDetails.get("seat_details") instanceof List) {
                    List<Map<String, Object>> seatDetails = (List<Map<String, Object>>) coachDetails
                            .get("seat_details");
                    for (Map<String, Object> seat : seatDetails) {
                        if (seat != null && seat.containsKey("passenger_details")
                                && seat.get("passenger_details") instanceof Map) {
                            rawPassengerMaps.add((Map<String, Object>) seat.get("passenger_details"));
                        }
                    }
                }
            }

            if (rawPassengerMaps.isEmpty()) {
                log.warn("No 'passenger_details' found at root or inside coach_details.seat_details for endpoint {}",
                        sanitizeUrl(fullUrl));
                return entities;
            }

            log.info("Extracted {} passenger_details objects from service details endpoint: {}",
                    rawPassengerMaps.size(), sanitizeUrl(fullUrl));

            for (Map<String, Object> passMap : rawPassengerMaps) {
                PassengerDetailsEntity entity = PassengerDetailsEntity.builder()
                        .opScheduleId(opScheduleId)
                        .routeId(routeId)
                        .operatorId(operatorId)
                        .name(getStringField(passMap, "name"))
                        .age(getIntegerField(passMap, "age"))
                        .gender(getStringField(passMap, "gender"))
                        .originId(getLongField(passMap, "origin_id"))
                        .originName(getStringField(passMap, "origin_name"))
                        .destinationId(getLongField(passMap, "destination_id"))
                        .destinationName(getStringField(passMap, "destination_name"))
                        .fromTo(getStringField(passMap, "from_to"))
                        .blockingTime(getStringField(passMap, "blocking_time"))
                        .seatFare(getStringField(passMap, "seat_fare"))
                        .ticketNo(getStringField(passMap, "ticket_no"))
                        .isEticket(getBooleanField(passMap, "is_eticket"))
                        .bookingFare(getStringField(passMap, "booking_fare"))
                        .phoneNum(getStringField(passMap, "phone_num"))
                        .countryCode(getStringField(passMap, "country_code"))
                        .boardingStage(getStringField(passMap, "boarding_stage"))
                        .landmark(getStringField(passMap, "landmark"))
                        .dropOffStage(getStringField(passMap, "drop_off_stage"))
                        .seatNo(getStringField(passMap, "seat_no"))
                        .bookedBy(getStringField(passMap, "booked_by"))
                        .remarks(getStringField(passMap, "remarks"))
                        .canCancel(getBooleanField(passMap, "can_cancel"))
                        .canCancelTicketForUser(getBooleanField(passMap, "can_cancel_ticket_for_user"))
                        .canShiftTicket(getBooleanField(passMap, "can_shift_ticket"))
                        .isTemporaryPhoneBlock(getBooleanField(passMap, "is_temporary_phone_block"))
                        .isPhoneBlock(getBooleanField(passMap, "is_phone_block"))
                        .noOfSeats(getIntegerField(passMap, "no_of_seats"))
                        .seatNumbers(getStringField(passMap, "seat_numbers"))
                        .depTime(getStringField(passMap, "dep_time"))
                        .travelDate(getStringField(passMap, "travel_date"))
                        .bookedDate(getStringField(passMap, "booked_date"))
                        .status(getIntegerField(passMap, "status"))
                        .isHisBooking(getBooleanField(passMap, "is_his_booking"))
                        .bookedById(getLongField(passMap, "booked_by_id"))
                        .travelBranchId(getLongField(passMap, "travel_branch_id"))
                        .build();

                entities.add(entity);
            }

            return entities;

        } catch (RestClientException rce) {
            log.error("HTTP error while calling service details endpoint {}: {}", sanitizeUrl(fullUrl), rce.getMessage(), rce);
            return entities;
        } catch (Exception ex) {
            log.error("Failed to parse passenger_details from endpoint {}: {}", sanitizeUrl(fullUrl), ex.getMessage(), ex);
            return entities;
        }
    }

    private String executeDecompressedGet(String fullUrl) {
        if (fullUrl != null && fullUrl.startsWith("http://")) {
            fullUrl = "https://" + fullUrl.substring(7);
        }

        HttpHeaders headers = new HttpHeaders();
        headers.set(HttpHeaders.ACCEPT_ENCODING, "gzip, deflate");
        HttpEntity<Void> requestEntity = new HttpEntity<>(headers);

        try {
            ResponseEntity<byte[]> response = restTemplate.exchange(fullUrl, HttpMethod.GET, requestEntity,
                    byte[].class);
            if (response.getBody() == null || response.getBody().length == 0) {
                return null;
            }

            // Follow HTTP 3xx Redirects if returned
            if (response.getStatusCode().is3xxRedirection()) {
                String location = response.getHeaders().getFirst(HttpHeaders.LOCATION);
                if (StringUtils.hasText(location)) {
                    log.info("Following HTTP redirect from {} to {}", sanitizeUrl(fullUrl), sanitizeUrl(location));
                    return executeDecompressedGet(location);
                }
            }

            byte[] bytes = response.getBody();
            String contentEncoding = response.getHeaders().getFirst(HttpHeaders.CONTENT_ENCODING);
            String decompressedStr = null;

            if ("gzip".equalsIgnoreCase(contentEncoding)) {
                try (GZIPInputStream gis = new GZIPInputStream(new ByteArrayInputStream(bytes))) {
                    decompressedStr = new String(gis.readAllBytes(), StandardCharsets.UTF_8);
                } catch (Exception e) {
                    log.error("Error decompressing GZIP response from {}: {}", sanitizeUrl(fullUrl), e.getMessage());
                }
            } else if ("deflate".equalsIgnoreCase(contentEncoding)) {
                try (InputStream is = new InflaterInputStream(new ByteArrayInputStream(bytes))) {
                    decompressedStr = new String(is.readAllBytes(), StandardCharsets.UTF_8);
                } catch (Exception e1) {
                    try (InputStream is = new InflaterInputStream(new ByteArrayInputStream(bytes),
                            new Inflater(true))) {
                        decompressedStr = new String(is.readAllBytes(), StandardCharsets.UTF_8);
                    } catch (Exception e2) {
                        log.error("Error decompressing DEFLATE response from {}: {}", sanitizeUrl(fullUrl), e2.getMessage());
                    }
                }
            } else {
                decompressedStr = new String(bytes, StandardCharsets.UTF_8);
            }

            if (decompressedStr != null && decompressedStr.trim().startsWith("<")) {
                log.error("Received HTML response instead of JSON from endpoint {}: {}", sanitizeUrl(fullUrl), decompressedStr);
                return null;
            }

            return decompressedStr;
        } catch (Exception e) {
            log.error("HTTP error fetching URL {}: {}", sanitizeUrl(fullUrl), e.getMessage(), e);
            return null;
        }
    }

    private String sanitizeUrl(String url) {
        if (url == null) {
            return null;
        }
        return url.replaceAll("(?i)([?&]api_key=)[^&]*", "$1*****");
    }

    private String getStringField(Map<String, Object> map, String key) {
        Object val = map.get(key);
        return val != null ? String.valueOf(val).trim() : null;
    }

    private Long getLongField(Map<String, Object> map, String key) {
        Object val = map.get(key);
        if (val == null)
            return null;
        try {
            return Long.valueOf(val.toString().trim());
        } catch (NumberFormatException nfe) {
            return null;
        }
    }

    private Integer getIntegerField(Map<String, Object> map, String key) {
        Object val = map.get(key);
        if (val == null)
            return null;
        try {
            return Integer.valueOf(val.toString().trim());
        } catch (NumberFormatException nfe) {
            return null;
        }
    }

    private Boolean getBooleanField(Map<String, Object> map, String key) {
        Object val = map.get(key);
        if (val == null)
            return null;
        if (val instanceof Boolean)
            return (Boolean) val;
        return Boolean.parseBoolean(val.toString().trim());
    }

    private Map<String, Object> selectRecordWithLargestId(List<Map<String, Object>> items) {
        if (items == null || items.isEmpty()) {
            return null;
        }
        return items.stream()
                .filter(item -> getLongField(item, "id") != null)
                .max(Comparator.comparingLong(item -> getLongField(item, "id")))
                .orElse(items.get(0));
    }
}
