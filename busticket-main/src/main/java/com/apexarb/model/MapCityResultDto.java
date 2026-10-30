package com.apexarb.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MapCityResultDto {

    private String operatorId;
    private String operatorUrl;
    private int totalOperatorCities;
    private int matchedCount;
    private int unmatchedCount;
    private String unmatchedFilePath;
    private List<OperatorCityDto> unmatchedCities;
}
