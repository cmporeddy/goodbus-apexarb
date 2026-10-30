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
public class CityDto implements Serializable {

    private static final long serialVersionUID = 1L;

    private Long id;
    private String name;
    private Integer originCount;
    private Integer destinationCount;
}
