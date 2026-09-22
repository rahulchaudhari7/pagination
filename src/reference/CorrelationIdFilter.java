package com.example.pagination_api.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.MDC;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

/**
 * Filter that establishes correlation IDs for end-to-end tracing in Spring Boot.
 * Reads X-Correlation-ID from the incoming request or creates a UUID, binds it to
 * SLF4J MDC (Mapped Diagnostic Context), and sets it on the HTTP response.
 */
@Component
public class CorrelationIdFilter extends OncePerRequestFilter {

    public static final String CORRELATION_ID_HEADER = "X-Correlation-ID";
    public static final String CORRELATION_ID_MDC_KEY = "correlationId";

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        try {
            String correlationId = request.getHeader(CORRELATION_ID_HEADER);
            if (correlationId == null || correlationId.trim().isEmpty()) {
                correlationId = UUID.randomUUID().toString();
            }

            // Bind to SLF4J MDC for logging in every thread execution
            MDC.put(CORRELATION_ID_MDC_KEY, correlationId);

            // Propagate in response header for downstream clients
            response.setHeader(CORRELATION_ID_HEADER, correlationId);
            response.setHeader("X-Request-ID", correlationId);

            filterChain.doFilter(request, response);
        } finally {
            // Clean up MDC to prevent thread pool memory leaks
            MDC.remove(CORRELATION_ID_MDC_KEY);
        }
    }
}
