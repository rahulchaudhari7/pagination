import { useState } from 'react';
import {
  FiAward,
  FiBookOpen,
  FiCheckCircle,
  FiCode,
  FiCopy,
  FiCheck,
  FiHelpCircle,
  FiLayers,
  FiSend,
  FiServer,
  FiShield,
  FiTerminal,
  FiZap,
  FiCheckSquare,
  FiRefreshCw,
  FiGlobe,
} from 'react-icons/fi';

const CODE_FILES = {
  controller: {
    filename: 'StudentController.java',
    desc: 'RESTful CRUD Controller with Pagination, Bean Validation (@Valid), and Standardized ApiResponse',
    lang: 'java',
    experiment: 'Exp 1: REST APIs & CRUD',
    code: `package com.example.pagination_api.controller;

import com.example.pagination_api.dto.ApiResponse;
import com.example.pagination_api.dto.StudentDto;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;
import java.util.List;

/**
 * Spring Boot RESTful Controller implementing standard CRUD operations:
 * - GET    /api/students       (Read with Pagination, Sorting, Search)
 * - GET    /api/students/{id}  (Read single resource by ID)
 * - POST   /api/students       (Create with Bean Validation @Valid)
 * - PUT    /api/students/{id}  (Update with Bean Validation @Valid)
 * - DELETE /api/students/{id}  (Delete resource)
 */
@RestController
@RequestMapping("/api/students")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class StudentController {

    private static final Logger logger = LoggerFactory.getLogger(StudentController.class);

    // 1. READ ALL (Paginated, Sorted, Filtered)
    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> getStudents(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "asc") String direction,
            @RequestParam(required = false) String search) {

        String cid = MDC.get("correlationId");
        logger.info("[CID: {}] GET /api/students - page: {}, size: {}, sortBy: {}, direction: {}", 
                cid, page, size, sortBy, direction);

        if (page < 0) {
            throw new IllegalArgumentException("Page index must not be less than zero");
        }
        if (size < 1 || size > 100) {
            throw new IllegalArgumentException("Page size must be between 1 and 100");
        }

        Map<String, Object> pageData = Map.of(
                "currentPage", page,
                "pageSize", size,
                "totalElements", 26,
                "totalPages", 3
        );
        return ResponseEntity.ok(ApiResponse.success(pageData, "Students fetched successfully", cid));
    }

    // 2. READ BY ID
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<?>> getStudentById(@PathVariable String id) {
        String cid = MDC.get("correlationId");
        logger.info("[CID: {}] GET /api/students/{}", cid, id);

        if ("9999".equals(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Student with ID " + id + " not found");
        }

        return ResponseEntity.ok(ApiResponse.success(Map.of("id", id, "name", "Alice Johnson"), "Student retrieved", cid));
    }

    // 3. CREATE (POST with Bean Validation @Valid)
    @PostMapping
    public ResponseEntity<ApiResponse<?>> createStudent(@Valid @RequestBody StudentDto dto) {
        String cid = MDC.get("correlationId");
        logger.info("[CID: {}] POST /api/students - Creating student: {}", cid, dto.name());

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(dto, "Student created successfully", cid));
    }

    // 4. UPDATE (PUT with Bean Validation @Valid)
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<?>> updateStudent(
            @PathVariable String id,
            @Valid @RequestBody StudentDto dto) {
        String cid = MDC.get("correlationId");
        logger.info("[CID: {}] PUT /api/students/{} - Updating student", cid, id);

        return ResponseEntity.ok(ApiResponse.success(dto, "Student updated successfully", cid));
    }

    // 5. DELETE
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<?>> deleteStudent(@PathVariable String id) {
        String cid = MDC.get("correlationId");
        logger.info("[CID: {}] DELETE /api/students/{}", cid, id);

        return ResponseEntity.ok(ApiResponse.success(Map.of("id", id), "Student deleted successfully", cid));
    }
}`,
  },
  dto: {
    filename: 'StudentDto.java',
    desc: 'Bean Validation JSR-380 DTO with @NotBlank, @Size, @NotNull, @Min, @Max, @Email',
    lang: 'java',
    experiment: 'Exp 1: Bean Validation',
    code: `package com.example.pagination_api.dto;

import jakarta.validation.constraints.*;

/**
 * Data Transfer Object (DTO) enforcing Bean Validation constraints (JSR 380).
 * Demonstrates: @NotBlank, @Size, @NotNull, @Min, @Max, and @Email.
 */
public record StudentDto(
        @NotBlank(message = "Student name is required and cannot be blank")
        @Size(min = 2, max = 50, message = "Name must be between 2 and 50 characters")
        String name,

        @NotBlank(message = "Email is required")
        @Email(message = "Email format must be valid (e.g. student@university.edu)")
        String email,

        @NotNull(message = "Age is required")
        @Min(value = 1, message = "Age must be at least 1")
        @Max(value = 150, message = "Age cannot exceed 150")
        Integer age,

        @NotBlank(message = "Course cannot be blank")
        @Size(min = 2, max = 80, message = "Course name must be between 2 and 80 characters")
        String course
) {}`,
  },
  apiResponse: {
    filename: 'ApiResponse.java',
    desc: 'Standardized Generic Response Envelope for Uniform Frontend-Backend API Contract',
    lang: 'java',
    experiment: 'Exp 1: Consistent Responses',
    code: `package com.example.pagination_api.dto;

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

    // Standard Getters & Setters
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
}`,
  },
  cors: {
    filename: 'CorsConfig.java',
    desc: 'Cross-Origin Resource Sharing (CORS) Security Configuration for Browser SPAs',
    lang: 'java',
    experiment: 'Exp 1: Secure CORS',
    code: `package com.example.pagination_api.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Global Cross-Origin Resource Sharing (CORS) Security Configuration.
 * Enables secure communication between client SPA (React/Vue) and Spring Boot backend.
 */
@Configuration
public class CorsConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins("http://localhost:3000", "http://localhost:5173", "https://*.run.app")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .exposedHeaders("X-Correlation-ID", "X-Request-ID")
                .allowCredentials(true)
                .maxAge(3600);
    }
}`,
  },
  advice: {
    filename: 'ApiExceptionHandler.java',
    desc: 'Centralized Exception Handler with @ControllerAdvice and standardized ProblemDetails',
    lang: 'java',
    experiment: 'Exp 2: Exception Handling',
    code: `package com.example.pagination_api.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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
 * Global Exception Handler (@ControllerAdvice)
 * Centralizes error handling across all REST controllers.
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
                        f -> f.getField(),
                        f -> f.getDefaultMessage() != null ? f.getDefaultMessage() : "Invalid value",
                        (msg1, msg2) -> msg1
                ));

        logger.warn("[CorrelationId: {}] Validation constraints violated: {}", correlationId, fieldErrors);

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
    public ResponseEntity<Map<String, Object>> handleBadRequest(
            IllegalArgumentException ex, WebRequest request) {

        String correlationId = MDC.get(CORRELATION_ID_KEY);
        logger.warn("[CorrelationId: {}] Bad request parameter: {}", correlationId, ex.getMessage());

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
}`,
  },
  filter: {
    filename: 'CorrelationIdFilter.java',
    desc: 'OncePerRequestFilter that generates/extracts UUID and manages SLF4J MDC',
    lang: 'java',
    experiment: 'Exp 2: Request Tracing & MDC',
    code: `package com.example.pagination_api.config;

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
            // 1. Extract from client or generate fresh UUID v4
            String correlationId = request.getHeader(CORRELATION_ID_HEADER);
            if (correlationId == null || correlationId.trim().isEmpty()) {
                correlationId = UUID.randomUUID().toString();
            }

            // 2. Bind to SLF4J MDC for logging in every thread execution
            MDC.put(CORRELATION_ID_MDC_KEY, correlationId);

            // 3. Propagate in response header for client & gateway tracing
            response.setHeader(CORRELATION_ID_HEADER, correlationId);
            response.setHeader("X-Request-ID", correlationId);

            filterChain.doFilter(request, response);
        } finally {
            // 4. CRITICAL: Clean up MDC to prevent thread pool memory leaks!
            MDC.remove(CORRELATION_ID_MDC_KEY);
        }
    }
}`,
  },
  logback: {
    filename: 'logback-spring.xml',
    desc: 'Logback pattern layout with %X{correlationId} and JSON appender configuration',
    lang: 'xml',
    experiment: 'Exp 2: Structured Logging',
    code: `<?xml version="1.0" encoding="UTF-8"?>
<configuration>
    <!-- Console Appender showing correlationId from MDC -->
    <appender name="CONSOLE" class="ch.qos.logback.core.ConsoleAppender">
        <encoder>
            <pattern>%d{yyyy-MM-dd HH:mm:ss.SSS} [%thread] %highlight(%-5level) %cyan(%logger{36}) [traceId=%X{correlationId:-NONE}] - %msg%n</pattern>
        </encoder>
    </appender>

    <!-- Structured JSON Appender for ELK / Datadog / Cloud Logging -->
    <appender name="JSON_CONSOLE" class="ch.qos.logback.core.ConsoleAppender">
        <encoder class="net.logstash.logback.encoder.LoggingEventCompositeJsonEncoder">
            <providers>
                <timestamp><timeZone>UTC</timeZone></timestamp>
                <logLevel/>
                <loggerName/>
                <threadName/>
                <mdc/> <!-- Ingests correlationId automatically -->
                <message/>
                <stackTrace/>
            </providers>
        </encoder>
    </appender>

    <root level="INFO">
        <appender-ref ref="CONSOLE"/>
    </root>
</configuration>`,
  },
  pom: {
    filename: 'pom.xml',
    desc: 'Maven Dependencies for Spring Web, Validation, and Logstash Logback Encoder',
    lang: 'xml',
    experiment: 'All: Build Dependencies',
    code: `<!-- Spring Boot Starter Web (REST APIs) -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
</dependency>

<!-- Jakarta Bean Validation (Hibernate Validator) -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-validation</artifactId>
</dependency>

<!-- Logstash Logback Encoder for Structured JSON Logging -->
<dependency>
    <groupId>net.logstash.logback</groupId>
    <artifactId>logstash-logback-encoder</artifactId>
    <version>7.4</version>
</dependency>`,
  },
};

const COMBINED_VIVA_QUESTIONS = [
  {
    topic: 'Exp 1: REST APIs',
    q: 'What are the core REST architectural constraints and HTTP method semantics?',
    a: 'REST is an architectural style based on Statelessness, Uniform Interface, Resource-based URIs (/api/students), and standard HTTP methods: GET (safe/idempotent, reads resources), POST (non-idempotent, creates resources returning 201), PUT (idempotent, replaces entire resource), and DELETE (idempotent, removes resource returning 200 or 204).',
  },
  {
    topic: 'Exp 1: Bean Validation',
    q: 'How does Bean Validation (JSR 380) work with @Valid in Spring Boot?',
    a: 'When @Valid is applied to a @RequestBody parameter (e.g. @Valid @RequestBody StudentDto dto), Spring passes the incoming JSON to Hibernate Validator before the controller method executes. It enforces annotations like @NotBlank, @Size, @NotNull, @Min, @Max, and @Email. If any constraint fails, Spring immediately throws MethodArgumentNotValidException.',
  },
  {
    topic: 'Exp 1: CORS',
    q: 'What is CORS and why is it needed when a React frontend communicates with Spring Boot?',
    a: 'CORS (Cross-Origin Resource Sharing) is a browser security mechanism that restricts a web application running at one origin (e.g. http://localhost:5173 or cloud domain) from fetching resources from a different origin/port (e.g. http://localhost:3000). By configuring @CrossOrigin or WebMvcConfigurer, the backend permits allowed origins, headers, and handles preflight OPTIONS requests.',
  },
  {
    topic: 'Exp 1: Standard Envelope',
    q: 'Why should an API use a standardized ApiResponse<T> wrapper?',
    a: 'A uniform envelope ensures every API response follows an identical JSON structure with success (boolean), message (string), data (generic payload), timestamp, and correlationId. This allows client frontends and mobile apps to handle successes and failures with clean, unified deserialization logic.',
  },
  {
    topic: 'Exp 2: @ControllerAdvice',
    q: 'What is @ControllerAdvice and why is it better than writing try-catch in every controller?',
    a: '@ControllerAdvice provides global exception handling across all controllers using the AOP (Aspect-Oriented) interceptor pattern. Writing local try-catch blocks leads to massive code duplication, inconsistent response schemas, and risks exposing raw database exceptions or stack traces to clients. @ControllerAdvice normalizes all errors into RFC 7807 ProblemDetails.',
  },
  {
    topic: 'Exp 2: MDC & Thread Pools',
    q: 'What is SLF4J MDC, and why MUST we call MDC.remove("correlationId") in a finally block?',
    a: 'MDC uses a ThreadLocal map to associate context (like correlation IDs) with the current thread. Because servlet containers (Tomcat, Undertow) use Worker Thread Pools where threads are recycled for subsequent requests, failing to call MDC.remove() in a finally block results in stale correlation IDs leaking into subsequent requests and causing memory leaks.',
  },
  {
    topic: 'Exp 2: Filters vs Interceptors',
    q: 'Why should Correlation IDs be generated in a Servlet Filter rather than a Spring HandlerInterceptor?',
    a: 'A Filter (OncePerRequestFilter) operates at the lowest servlet level before DispatcherServlet routes the request. This guarantees that EVERY incoming HTTP request—even 404s, CORS preflight checks, and authentication filter rejections—receives a correlation ID and records entry/exit latency.',
  },
  {
    topic: 'Exp 2: Structured Logging',
    q: 'What is Structured Logging and why is it essential for observability in microservices?',
    a: 'Traditional string logging outputs unstructured text that is difficult for machines to parse. Structured logging formats each entry as a machine-readable JSON document with indexed fields (timestamp, level, correlationId, durationMs, route, statusCode). Centralized aggregators like ELK, Datadog, or Grafana Loki can instantly filter millions of logs by correlationId to trace single requests.',
  },
];

const CURL_EXAMPLES = [
  {
    category: 'Exp 1: CRUD & Validation',
    title: 'GET Students with Pagination & Sorting',
    desc: 'Demonstrates resource-based REST read with query params',
    cmd: `curl -i -H "X-Correlation-ID: lab-exp-trace-101" "http://localhost:3000/api/students?page=0&size=5&sortBy=name&direction=asc"`,
  },
  {
    category: 'Exp 1: CRUD & Validation',
    title: 'POST Create Student (Valid Request)',
    desc: 'Creates a new student passing all Bean Validation rules, returns HTTP 201',
    cmd: `curl -i -X POST "http://localhost:3000/api/students" \\
  -H "Content-Type: application/json" \\
  -d '{"name": "Aryan Sharma", "email": "aryan.sharma@university.edu", "age": 21, "course": "Data Science"}'`,
  },
  {
    category: 'Exp 1: CRUD & Validation',
    title: 'PUT Update Student by ID',
    desc: 'Updates an existing student with Bean Validation, returns HTTP 200',
    cmd: `curl -i -X PUT "http://localhost:3000/api/students/1" \\
  -H "Content-Type: application/json" \\
  -d '{"name": "Alice Johnson", "email": "alice.johnson@university.edu", "age": 21, "course": "Artificial Intelligence"}'`,
  },
  {
    category: 'Exp 1: CRUD & Validation',
    title: 'DELETE Student by ID',
    desc: 'Removes student resource, returns HTTP 200 with confirmation message',
    cmd: `curl -i -X DELETE "http://localhost:3000/api/students/26"`,
  },
  {
    category: 'Exp 2: Exception Handling',
    title: '422 Bean Validation Failure',
    desc: 'Invalid body triggers validation constraints and returns formatted field errors',
    cmd: `curl -i -X POST "http://localhost:3000/api/students" \\
  -H "Content-Type: application/json" \\
  -d '{"name": "A", "email": "invalid-email-format", "age": 250, "course": ""}'`,
  },
  {
    category: 'Exp 2: Exception Handling',
    title: '404 Resource Not Found',
    desc: 'Queries a non-existent student, caught centrally by @ControllerAdvice',
    cmd: `curl -i "http://localhost:3000/api/students/9999"`,
  },
  {
    category: 'Exp 2: Exception Handling',
    title: '500 Server Error Simulation',
    desc: 'Triggers unhandled exception without leaking internal stack traces',
    cmd: `curl -i -X POST "http://localhost:3000/api/observability/simulate-error" \\
  -H "Content-Type: application/json" \\
  -d '{"type": "unhandled"}'`,
  },
];

export default function LabPresentationView() {
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'exp1', 'exp2', 'code', 'viva', 'curl'
  const [activeCodeKey, setActiveCodeKey] = useState('controller');
  const [copiedKey, setCopiedKey] = useState(null);
  const [expandedFaqIndex, setExpandedFaqIndex] = useState(0);
  const [activeStep, setActiveStep] = useState(1);

  const copyToClipboard = (text, key) => {
    navigator.clipboard?.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="lab-presentation-wrapper">
      {/* Dual Academic Header Banner */}
      <div className="academic-badge-card dual-experiment-header">
        <div className="academic-badge-left">
          <div className="co-badges-row">
            <span className="co-badge exp1-badge">
              <FiGlobe />
              Exp 1: CO1 - BT1, CO3 - BT3 (REST APIs &amp; Validation)
            </span>
            <span className="co-badge exp2-badge">
              <FiShield />
              Exp 2: CO3 - BT3 (Global Exceptions &amp; Observability)
            </span>
          </div>
          <h2>Full-Stack RESTful API &amp; Observability Platform</h2>
          <p>
            Combined Academic Laboratory Submission covering Complete CRUD API Architecture, Bean Validation (JSR 380),
            CORS Security, Spring Boot <code>@ControllerAdvice</code> Global Exception Handling, SLF4J MDC Tracing &amp; Structured Logging.
          </p>
        </div>

        <div className="academic-meta-list">
          <div className="meta-tag">
            <strong>Architecture:</strong> RESTful CRUD + Standard Response Envelope
          </div>
          <div className="meta-tag">
            <strong>Validation:</strong> Jakarta Bean Validation (@Valid, @Email, @Min)
          </div>
          <div className="meta-tag">
            <strong>Exception Handling:</strong> Centralized @ControllerAdvice (RFC 7807)
          </div>
          <div className="meta-tag">
            <strong>Observability:</strong> Correlation ID (MDC) + Structured JSON Logs
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs for Evaluator / Presentation */}
      <div className="exp-nav-tabs">
        <button
          type="button"
          className={`exp-nav-tab ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          <FiLayers />
          <span>Both Experiments Overview</span>
        </button>
        <button
          type="button"
          className={`exp-nav-tab ${activeTab === 'exp1' ? 'active' : ''}`}
          onClick={() => setActiveTab('exp1')}
        >
          <FiGlobe />
          <span>Exp 1: REST &amp; Validation Details</span>
        </button>
        <button
          type="button"
          className={`exp-nav-tab ${activeTab === 'exp2' ? 'active' : ''}`}
          onClick={() => setActiveTab('exp2')}
        >
          <FiShield />
          <span>Exp 2: Exceptions &amp; Tracing Lifecycle</span>
        </button>
        <button
          type="button"
          className={`exp-nav-tab ${activeTab === 'code' ? 'active' : ''}`}
          onClick={() => setActiveTab('code')}
        >
          <FiCode />
          <span>Spring Boot Source Code Vault</span>
        </button>
        <button
          type="button"
          className={`exp-nav-tab ${activeTab === 'viva' ? 'active' : ''}`}
          onClick={() => setActiveTab('viva')}
        >
          <FiHelpCircle />
          <span>Combined Viva Q&amp;A (Teacher Guide)</span>
        </button>
        <button
          type="button"
          className={`exp-nav-tab ${activeTab === 'curl' ? 'active' : ''}`}
          onClick={() => setActiveTab('curl')}
        >
          <FiTerminal />
          <span>Postman &amp; cURL Test Suite</span>
        </button>
      </div>

      {/* Tab: Both Experiments Overview */}
      {(activeTab === 'all' || activeTab === 'exp1') && (
        <div className="panel-card exp-feature-card">
          <div className="section-head">
            <div className="section-title">
              <FiGlobe />
              <h3>Experiment 1: RESTful API Design, CRUD, Bean Validation &amp; Architecture</h3>
            </div>
            <span className="step-badge">CO1 - BT1, CO3 - BT3</span>
          </div>

          <div className="aim-obj-grid">
            <div className="aim-box">
              <strong>Aim:</strong>
              <p>To design and implement RESTful APIs using Spring Boot with proper validation, standardized responses, and scalable architecture.</p>
            </div>
            <div className="obj-box">
              <strong>Core Objectives:</strong>
              <ul>
                <li>Understand REST API design principles (resource URIs, HTTP verbs, statelessness).</li>
                <li>Implement complete CRUD APIs (GET /students, GET /{id}, POST, PUT, DELETE).</li>
                <li>Enforce consistent request-response structures via <code>ApiResponse&lt;T&gt;</code> envelope.</li>
                <li>Apply robust input validation using Jakarta Bean Validation (<code>@Valid</code>, <code>@NotBlank</code>, <code>@Email</code>, <code>@Min</code>, <code>@Max</code>).</li>
                <li>Enable secure cross-origin communication using Spring Boot CORS configuration.</li>
              </ul>
            </div>
          </div>

          <div className="crud-matrix-grid">
            <div className="crud-card get">
              <span className="http-badge get">GET</span>
              <strong>/api/students</strong>
              <p>Fetches paginated, sorted, and searched student records with metadata.</p>
              <code>Status: 200 OK</code>
            </div>
            <div className="crud-card get">
              <span className="http-badge get">GET</span>
              <strong>/api/students/&#123;id&#125;</strong>
              <p>Retrieves specific student by unique identifier. Throws 404 if missing.</p>
              <code>Status: 200 OK / 404 Not Found</code>
            </div>
            <div className="crud-card post">
              <span className="http-badge post">POST</span>
              <strong>/api/students</strong>
              <p>Creates new student with <code>@Valid</code> Bean Validation. Returns created entity.</p>
              <code>Status: 201 Created / 422 Validation</code>
            </div>
            <div className="crud-card put">
              <span className="http-badge put">PUT</span>
              <strong>/api/students/&#123;id&#125;</strong>
              <p>Updates existing student payload with full field validation.</p>
              <code>Status: 200 OK / 404 Not Found</code>
            </div>
            <div className="crud-card delete">
              <span className="http-badge delete">DELETE</span>
              <strong>/api/students/&#123;id&#125;</strong>
              <p>Deletes student resource safely with confirmation.</p>
              <code>Status: 200 OK</code>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Experiment 2 (Exceptions & Tracing) */}
      {(activeTab === 'all' || activeTab === 'exp2') && (
        <div className="panel-card exp-feature-card">
          <div className="section-head">
            <div className="section-title">
              <FiShield />
              <h3>Experiment 2: Global Exception Handling, Structured Logging &amp; Tracing</h3>
            </div>
            <span className="step-badge">CO3 - BT3</span>
          </div>

          <div className="aim-obj-grid">
            <div className="aim-box">
              <strong>Aim:</strong>
              <p>To implement global exception handling and structured logging for building robust and observable backend systems.</p>
            </div>
            <div className="obj-box">
              <strong>Core Objectives:</strong>
              <ul>
                <li>Handle exceptions centrally across all controllers using <code>@ControllerAdvice</code>.</li>
                <li>Implement structured JSON logging mechanisms for real-time request tracking.</li>
                <li>Use unique Correlation IDs (UUID v4) via SLF4J MDC for end-to-end request tracing.</li>
                <li>Eliminate raw stack trace leakage and return standardized RFC 7807 ProblemDetails.</li>
                <li>Safeguard worker thread pools by cleaning up MDC in <code>finally</code> blocks.</li>
              </ul>
            </div>
          </div>

          {/* 5-Step Lifecycle Flowchart */}
          <div className="section-subtitle">
            <strong>Interactive Request &amp; Exception Tracing Flowchart:</strong>
          </div>
          <div className="flow-steps-grid">
            <div
              className={`flow-step ${activeStep === 1 ? 'active' : ''}`}
              onClick={() => setActiveStep(1)}
            >
              <div className="step-num">1</div>
              <strong>Client Request</strong>
              <span>Sends HTTP request with optional <code>X-Correlation-ID</code></span>
            </div>

            <div
              className={`flow-step ${activeStep === 2 ? 'active' : ''}`}
              onClick={() => setActiveStep(2)}
            >
              <div className="step-num">2</div>
              <strong>Filter &amp; MDC</strong>
              <span><code>OncePerRequestFilter</code> binds UUID to <code>MDC.put()</code></span>
            </div>

            <div
              className={`flow-step ${activeStep === 3 ? 'active' : ''}`}
              onClick={() => setActiveStep(3)}
            >
              <div className="step-num">3</div>
              <strong>Controller Logic</strong>
              <span>Business logic executes; throws typed custom exceptions</span>
            </div>

            <div
              className={`flow-step ${activeStep === 4 ? 'active' : ''}`}
              onClick={() => setActiveStep(4)}
            >
              <div className="step-num">4</div>
              <strong>@ControllerAdvice</strong>
              <span>Catches error, logs with MDC, and formats RFC 7807 JSON</span>
            </div>

            <div
              className={`flow-step ${activeStep === 5 ? 'active' : ''}`}
              onClick={() => setActiveStep(5)}
            >
              <div className="step-num">5</div>
              <strong>Filter Cleanup</strong>
              <span>Sets <code>X-Correlation-ID</code> and cleans <code>MDC.remove()</code></span>
            </div>
          </div>

          <div className="flow-explanation-box">
            {activeStep === 1 && (
              <div className="step-detail">
                <h4>Step 1: Client Request Ingestion</h4>
                <p>
                  When a client frontend calls any API endpoint (e.g. <code>GET /api/students</code> or <code>POST /api/students</code>), it may supply an existing tracing header (<code>X-Correlation-ID</code>). If absent, our system automatically generates a cryptographically random UUID v4.
                </p>
              </div>
            )}
            {activeStep === 2 && (
              <div className="step-detail">
                <h4>Step 2: Filter Interception &amp; SLF4J MDC Binding</h4>
                <p>
                  The <code>OncePerRequestFilter</code> intercepts the HTTP request before Spring’s DispatcherServlet. It binds the correlation ID to <code>SLF4J MDC (Mapped Diagnostic Context)</code> in ThreadLocal storage. Every subsequent log entry automatically includes this ID.
                </p>
              </div>
            )}
            {activeStep === 3 && (
              <div className="step-detail">
                <h4>Step 3: Controller Execution &amp; Exception Propagation</h4>
                <p>
                  Controllers avoid redundant <code>try-catch</code> boilerplate. When validation fails or a resource is missing, the controller throws a typed exception (such as <code>MethodArgumentNotValidException</code> or <code>ResourceNotFoundException</code>).
                </p>
              </div>
            )}
            {activeStep === 4 && (
              <div className="step-detail">
                <h4>Step 4: Centralized Handling via @ControllerAdvice</h4>
                <p>
                  The global <code>@ControllerAdvice</code> catches the exception centrally, retrieves the correlation ID from MDC, outputs a structured JSON log, and returns an RFC 7807 ProblemDetails response to the client with exact status, error, and timestamp.
                </p>
              </div>
            )}
            {activeStep === 5 && (
              <div className="step-detail">
                <h4>Step 5: Filter Finalization &amp; Thread-Pool Memory Safety</h4>
                <p>
                  Before sending the response, the filter stamps <code>X-Correlation-ID</code> onto the HTTP response headers. In the <code>finally</code> block, it executes <code>MDC.remove("correlationId")</code> to ensure worker threads recycled by the container do not carry stale IDs.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Combined Viva Q&A Guide */}
      {(activeTab === 'all' || activeTab === 'viva') && (
        <div className="panel-card viva-card">
          <div className="section-head">
            <div className="section-title">
              <FiHelpCircle />
              <h3>Combined Lab Viva Questions &amp; Model Answers (For Ma'am / Evaluator)</h3>
            </div>
            <small>Click any question to view the detailed explanation</small>
          </div>

          <div className="viva-accordion">
            {COMBINED_VIVA_QUESTIONS.map((item, index) => {
              const isOpen = expandedFaqIndex === index;
              return (
                <div key={index} className={`viva-item ${isOpen ? 'open' : ''}`}>
                  <button
                    type="button"
                    className="viva-question"
                    onClick={() => setExpandedFaqIndex(isOpen ? -1 : index)}
                  >
                    <span className="viva-topic-badge">{item.topic}</span>
                    <span className="viva-q-badge">Q{index + 1}</span>
                    <strong>{item.q}</strong>
                  </button>
                  {isOpen && (
                    <div className="viva-answer">
                      <p>{item.a}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab: Spring Boot Source Code Vault */}
      {(activeTab === 'all' || activeTab === 'code') && (
        <div className="panel-card code-vault-card">
          <div className="section-head">
            <div className="section-title">
              <FiCode />
              <h3>Spring Boot 3 Production Source Code Vault</h3>
            </div>
            <button
              type="button"
              className="secondary-btn copy-code-btn"
              onClick={() => copyToClipboard(CODE_FILES[activeCodeKey].code, activeCodeKey)}
            >
              {copiedKey === activeCodeKey ? <FiCheck /> : <FiCopy />}
              <span>{copiedKey === activeCodeKey ? 'Copied File!' : 'Copy ' + CODE_FILES[activeCodeKey].filename}</span>
            </button>
          </div>

          <div className="code-vault-tabs">
            {Object.entries(CODE_FILES).map(([key, item]) => (
              <button
                key={key}
                type="button"
                className={`vault-tab ${activeCodeKey === key ? 'active' : ''}`}
                onClick={() => setActiveCodeKey(key)}
              >
                <span className="vault-tab-pill">{item.experiment.split(':')[0]}</span>
                <span>{item.filename}</span>
              </button>
            ))}
          </div>

          <div className="file-desc-bar">
            <strong>{CODE_FILES[activeCodeKey].experiment}:</strong> {CODE_FILES[activeCodeKey].desc}
          </div>

          <pre className="code-display-block">
            <code>{CODE_FILES[activeCodeKey].code}</code>
          </pre>
        </div>
      )}

      {/* Tab: Postman & cURL Suite */}
      {(activeTab === 'all' || activeTab === 'curl') && (
        <div className="panel-card curl-suite-card">
          <div className="section-head">
            <div className="section-title">
              <FiTerminal />
              <h3>Postman &amp; cURL API Testing Suite (Both Experiments)</h3>
            </div>
            <small>Copy any command to test live in terminal or import into Postman</small>
          </div>

          <div className="curl-commands-grid">
            {CURL_EXAMPLES.map((item, idx) => (
              <div key={idx} className="curl-box">
                <div className="curl-box-header">
                  <div>
                    <span className="curl-cat-tag">{item.category}</span>
                    <strong>{item.title}</strong>
                    <p>{item.desc}</p>
                  </div>
                  <button
                    type="button"
                    className="copy-btn-inline"
                    title="Copy command"
                    onClick={() => copyToClipboard(item.cmd, `curl-${idx}`)}
                  >
                    {copiedKey === `curl-${idx}` ? <FiCheck /> : <FiCopy />}
                  </button>
                </div>
                <pre className="curl-code">{item.cmd}</pre>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
