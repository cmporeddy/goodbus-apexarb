package com.apexarb.service;

import com.apexarb.model.CityDto;

import java.util.List;

public interface CityService {

    /**
     * Get all cities. Cached with key 'cities'.
     *
     * @return List of CityDto
     */
    List<CityDto> getCities();

    /**
     * Manually or programmatically refresh/reload the cities cache.
     *
     * @return Fresh List of CityDto after cache refresh
     */
    List<CityDto> refreshCitiesCache();
}
