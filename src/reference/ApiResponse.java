package com.example.pagination_api.dto;

import java.time.Instant;

/**
 * Standardized API Response Envelope for consistent frontend-backend communication.
 * @param <T> Payload data type
 */
public class ApiResponse<T> {
    private boolean success;
    private String message;
    private T data;
    private String timestamp;
    private String correlationId;

    public ApiResponse() {
        this.timestamp = Instant.now().toString();
    }

    public ApiResponse(boolean success, String message, T data, String correlationId) {
        this.success = success;
        this.message = message;
        this.data = data;
        this.timestamp = Instant.now().toString();
        this.correlationId = correlationId;
    }

    public static <T> ApiResponse<T> success(T data, String message, String correlationId) {
        return new ApiResponse<>(true, message, data, correlationId);
    }

    public static <T> ApiResponse<T> error(String message, String correlationId) {
        return new ApiResponse<>(false, message, null, correlationId);
    }

    // Getters and Setters
    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public T getData() { return data; }
    public void setData(T data) { this.data = data; }
    public String getTimestamp() { return timestamp; }
    public void setTimestamp(String timestamp) { this.timestamp = timestamp; }
    public String getCorrelationId() { return correlationId; }
    public void setCorrelationId(String correlationId) { this.correlationId = correlationId; }
}
