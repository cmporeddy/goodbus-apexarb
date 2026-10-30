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
public class PaymentStatusResponse {
    private boolean success;
    private String merchantOrderId;
    private String orderId;
    private String state; // PENDING, COMPLETED, FAILED, EXPIRED
    private Long amount; // in paise
    private String paymentMode;
    private String blockKey;
    private String tin;
    private String pnr;
    private String message;
}
