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
public class Operators {

    private Integer id;
    private String operatorId;
    private String name;
    private String operatorUrl;
    @ToString.Exclude
    private String apiKey;
    private String active;
    private String createdAt;
    private String updatedAt;

}
