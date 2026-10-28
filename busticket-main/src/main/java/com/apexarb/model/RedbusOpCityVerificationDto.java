package com.apexarb.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RedbusOpCityVerificationDto implements Serializable {

    private static final long serialVersionUID = 1L;

    private Long id;
    private String operatorId;
    private Long opCityId;
    private String operatorCityName;
    private String redCityId;
    private String redbusCityName;
    private Boolean isMatch;
    private String status;
    private String isActive;
}
