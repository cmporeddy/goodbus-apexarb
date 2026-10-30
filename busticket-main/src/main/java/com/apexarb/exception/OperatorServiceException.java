package com.apexarb.exception;

public class OperatorServiceException extends RuntimeException {

    public OperatorServiceException(String message) {
        super(message);
    }

    public OperatorServiceException(String message, Throwable cause) {
        super(message, cause);
    }
}
