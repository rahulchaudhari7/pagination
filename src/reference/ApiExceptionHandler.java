package com.example.pagination_api.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Global Centralized Exception Handling using Spring's @ControllerAdvice.
 * Catches all controller exceptions, enriches error responses with the
 * correlation ID from MDC, and logs structured error events.
 */
@ControllerAdvice
public class ApiExceptionHandler {

    private static final Logger logger = LoggerFactory.getLogger(ApiExceptionHandler.class);
    private static final String CORRELATION_ID_KEY = "correlationId";

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, Object>> handleResponseStatusException(
            ResponseStatusException ex, WebRequest request) {

        String correlationId = MDC.get(CORRELATION_ID_KEY);
        logger.warn("[CorrelationId: {}] Handled ResponseStatusException: {} - {}",
                correlationId, ex.getStatusCode(), ex.getReason());

        Map<String, Object> errorBody = buildErrorResponse(
                HttpStatus.valueOf(ex.getStatusCode().value()),
                ex.getReason(),
                request.getDescription(false),
                correlationId
        );

        return ResponseEntity.status(ex.getStatusCode()).body(errorBody);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationException(
            MethodArgumentNotValidException ex, WebRequest request) {

        String correlationId = MDC.get(CORRELATION_ID_KEY);
        Map<String, String> fieldErrors = ex.getBindingResult().getFieldErrors().stream()
                .collect(Collectors.toMap(
                        FieldError::getField,
                        error -> error.getDefaultMessage() != null ? error.getDefaultMessage() : "Invalid value",
                        (msg1, msg2) -> msg1
                ));

        logger.warn("[CorrelationId: {}] Validation failed for request: {}", correlationId, fieldErrors);

        Map<String, Object> errorBody = buildErrorResponse(
                HttpStatus.UNPROCESSABLE_ENTITY,
                "Validation failed for request payload",
                request.getDescription(false),
                correlationId
        );
        errorBody.put("validationErrors", fieldErrors);

        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY).body(errorBody);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalArgumentException(
            IllegalArgumentException ex, WebRequest request) {

        String correlationId = MDC.get(CORRELATION_ID_KEY);
        logger.warn("[CorrelationId: {}] Bad request: {}", correlationId, ex.getMessage());

        Map<String, Object> errorBody = buildErrorResponse(
                HttpStatus.BAD_REQUEST,
                ex.getMessage(),
                request.getDescription(false),
                correlationId
        );

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorBody);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGlobalException(
            Exception ex, WebRequest request) {

        String correlationId = MDC.get(CORRELATION_ID_KEY);
        logger.error("[CorrelationId: {}] Unhandled internal server error occurred", correlationId, ex);

        Map<String, Object> errorBody = buildErrorResponse(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "An unexpected internal error occurred. Please contact support referencing correlation ID.",
                request.getDescription(false),
                correlationId
        );

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorBody);
    }

    private Map<String, Object> buildErrorResponse(
            HttpStatus status, String message, String path, String correlationId) {
        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", Instant.now().toString());
        body.put("status", status.value());
        body.put("error", status.getReasonPhrase());
        body.put("message", message);
        body.put("correlationId", correlationId != null ? correlationId : "unknown");
        body.put("path", path.replace("uri=", ""));
        return body;
    }
}
