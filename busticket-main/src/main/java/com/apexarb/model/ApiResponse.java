package com.apexarb.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApiResponse {

    private String status;
    private String message;
    private Object data;
    private LocalDateTime timestamp;

    public static ApiResponse success(Object data, String message) {
        return ApiResponse.builder()
                .status("SUCCESS")
                .message(message)
                .data(data)
                .timestamp(LocalDateTime.now())
                .build();
    }

    public static ApiResponse success(String message, Object data) {
        return ApiResponse.builder()
                .status("SUCCESS")
                .message(message)
                .data(data)
                .timestamp(LocalDateTime.now())
                .build();
    }

    public static ApiResponse success(Object data) {
        return success(data, "Success");
    }

    public static ApiResponse error(String message) {
        return ApiResponse.builder()
                .status("ERROR")
                .message(message)
                .data(null)
                .timestamp(LocalDateTime.now())
                .build();
    }

    public static ApiResponse error(String message, Object data) {
        return ApiResponse.builder()
                .status("ERROR")
                .message(message)
                .data(data)
                .timestamp(LocalDateTime.now())
                .build();
    }

    public static ApiResponse error(Object data, String message) {
        return ApiResponse.builder()
                .status("ERROR")
                .message(message)
                .data(data)
                .timestamp(LocalDateTime.now())
                .build();
    }
}
