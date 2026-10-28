package com.apexarb.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public class CreatePaymentOrderRequest {
    private String merchantOrderId;
    private String blockKey;
    private BigDecimal amount; // in Rupees
    private String redirectUrl;
    private String tripId;
    private String sourceCity;
    private String destCity;
    private String doj;
    private String contactMobile;
    private String contactEmail;
    private String busType;
    private String boardingPoint;
    private String departureTime;
    private String seatNumbers;
    private Object passengerDetails;
}
