package com.apexarb.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import lombok.ToString;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MapCityRequest {

    private String operatorId;
    private String operatorUrl;
    @ToString.Exclude
    private String apiKey;
}
