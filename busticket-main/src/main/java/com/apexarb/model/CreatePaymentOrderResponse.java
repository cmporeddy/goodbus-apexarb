package com.apexarb.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public class CreatePaymentOrderResponse {
    private boolean success;
    private String merchantOrderId;
    private String orderId;
    private String keyId;
    private Long amount; // in paise
    private String currency;
    private String redirectUrl;
    private String callbackUrl;
    private Long expireAt;
    private String state;
    private String message;
}
