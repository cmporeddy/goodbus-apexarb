package com.apexarb.service.impl;

import com.apexarb.exception.CityServiceException;
import com.apexarb.model.CityApiResponse;
import com.apexarb.model.CityDto;
import com.apexarb.service.CityService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class CityServiceImpl implements CityService {

    private final CacheManager cacheManager;
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${ticketsimply.api.cities-url:https://gds.ticketsimply.com/gds/api/cities.json}")
    private String citiesUrl;

    @Value("${ticketsimply.api.api-key:TSDBNGAPI30025020}")
    private String apiKey;

    public static final String CITIES_CACHE_NAME = "cities";

    @Override
    @Cacheable(value = CITIES_CACHE_NAME, key = "'allCities'")
    public List<CityDto> getCities() {
        log.info("Cache miss! Fetching cities data from TicketSimply API...");
        return fetchCitiesFromExternalApi();
    }

    @Override
    public List<CityDto> refreshCitiesCache() {
        log.info("Evicting cities cache and reloading fresh data...");
        Cache cache = cacheManager.getCache(CITIES_CACHE_NAME);
        if (cache != null) {
            cache.clear();
            log.info("Successfully evicted '{}' cache.", CITIES_CACHE_NAME);
        }

        List<CityDto> freshCities = fetchCitiesFromExternalApi();
        if (cache != null && freshCities != null) {
            cache.put("allCities", freshCities);
            log.info("Successfully repopulated '{}' cache with {} cities.", CITIES_CACHE_NAME, freshCities.size());
        }
        return freshCities;
    }

    /**
     * Scheduled job running weekly (every Sunday at midnight by default).
     * Cron expression: "0 0 0 * * SUN"
     */
    @Scheduled(cron = "${ticketsimply.api.cities-cache-cron:0 0 0 * * SUN}")
    public void scheduledWeeklyCacheRefresh() {
        log.info("Triggering scheduled weekly refresh for cities cache...");
        try {
            refreshCitiesCache();
            log.info("Scheduled weekly refresh for cities cache completed successfully.");
        } catch (Exception e) {
            log.error("Failed scheduled weekly refresh for cities cache: {}", e.getMessage(), e);
        }
    }

    private List<CityDto> fetchCitiesFromExternalApi() {
        String fullUrl = UriComponentsBuilder.fromUriString(citiesUrl)
                .queryParam("api_key", apiKey)
                .build()
                .toUriString();

        log.info("Sending GET request to external TicketSimply API: {}", sanitizeUrl(fullUrl));
        try {
            CityApiResponse response = restTemplate.getForObject(fullUrl, CityApiResponse.class);
            if (response == null || response.getResult() == null) {
                log.warn("Received empty response from TicketSimply API.");
                return new ArrayList<>();
            }

            List<List<Object>> rawRows = response.getResult();
            List<CityDto> cities = new ArrayList<>();

            // Skip index 0 if it contains headers ["id", "name", "origin_count", "destination_count"]
            int startIndex = 0;
            if (!rawRows.isEmpty()) {
                List<Object> firstRow = rawRows.get(0);
                if (firstRow != null && !firstRow.isEmpty() && "id".equalsIgnoreCase(String.valueOf(firstRow.get(0)))) {
                    startIndex = 1;
                }
            }

            for (int i = startIndex; i < rawRows.size(); i++) {
                List<Object> row = rawRows.get(i);
                if (row != null && row.size() >= 4) {
                    try {
                        Long id = Long.valueOf(row.get(0).toString());
                        String name = row.get(1) != null ? row.get(1).toString() : "";
                        Integer originCount = Integer.valueOf(row.get(2).toString());
                        Integer destinationCount = Integer.valueOf(row.get(3).toString());

                        cities.add(CityDto.builder()
                                .id(id)
                                .name(name)
                                .originCount(originCount)
                                .destinationCount(destinationCount)
                                .build());
                    } catch (NumberFormatException nfe) {
                        log.warn("Skipping invalid row at index {}: {}", i, row);
                    }
                }
            }

            log.info("Successfully fetched and processed {} cities from TicketSimply API.", cities.size());
            return cities;
        } catch (RestClientException rce) {
            log.error("HTTP error while calling TicketSimply API: {}", rce.getMessage(), rce);
            throw new CityServiceException("Failed to fetch cities from external provider: " + rce.getMessage(), rce);
        } catch (Exception ex) {
            log.error("Unexpected error occurred while fetching cities: {}", ex.getMessage(), ex);
            throw new CityServiceException("Unexpected error during city data retrieval: " + ex.getMessage(), ex);
        }
    }

    private String sanitizeUrl(String url) {
        if (url == null) {
            return null;
        }
        return url.replaceAll("(?i)([?&]api_key=)[^&]*", "$1*****");
    }
}
