package com.apexarb.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MapRedbusCityRequest {

    private String operatorId;
    private String operatorUrl;
    private String apiKey;
}
