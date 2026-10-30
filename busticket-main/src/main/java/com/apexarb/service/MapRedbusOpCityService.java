package com.apexarb.service;

import com.apexarb.entity.RedbusOpCityMapEntity;
import com.apexarb.model.MapRedbusCityRequest;
import com.apexarb.model.MapRedbusCityResultDto;
import com.apexarb.model.RedbusOpCityVerificationResultDto;

import java.util.List;

public interface MapRedbusOpCityService {

    MapRedbusCityResultDto mapCities(MapRedbusCityRequest request);

    List<RedbusOpCityMapEntity> getAllMappedCities();

    RedbusOpCityMapEntity getMappedCityByOperatorIdAndOpCityId(String operatorId, Long opCityId);

    RedbusOpCityVerificationResultDto verifyCityMappingsByOperatorId(String operatorId);
}

