package com.apexarb.service;

import com.apexarb.entity.BitOpCityMapEntity;
import com.apexarb.model.MapCityRequest;
import com.apexarb.model.MapCityResultDto;

import java.util.List;

public interface MapBitOpCityService {

    /**
     * Map operator cities with BIT cities, saving matched records to DB (Bit_OP_City_Map)
     * and writing unmatched cities to a JSON file named <operator_id>.json in resources directory.
     *
     * @param request MapCityRequest containing operatorId, operatorUrl, and optional apiKey
     * @return MapCityResultDto containing detailed mapping summary
     */
    MapCityResultDto mapCities(MapCityRequest request);

    /**
     * Fetch all mapped city records from Bit_OP_City_Map table.
     *
     * @return List of BitOpCityMapEntity
     */
    List<BitOpCityMapEntity> getAllMappedCities();

    /**
     * Fetch mapped city record filtered by operatorId and bitCityId.
     *
     * @param operatorId Operator ID
     * @param bitCityId BIT (X) City ID
     * @return BitOpCityMapEntity matching record
     */
    BitOpCityMapEntity getMappedCityByOperatorIdAndBitCityId(String operatorId, Long bitCityId);
}
