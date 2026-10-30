package com.apexarb.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RedbusOpCityVerificationResultDto implements Serializable {

    private static final long serialVersionUID = 1L;

    private String operatorId;
    private Integer totalMappings;
    private Integer matchedCount;
    private Integer mismatchedCount;
    private List<RedbusOpCityVerificationDto> mappings;
}
