package com.apexarb.exception;

public class CityServiceException extends RuntimeException {

    public CityServiceException(String message) {
        super(message);
    }

    public CityServiceException(String message, Throwable cause) {
        super(message, cause);
    }
}
