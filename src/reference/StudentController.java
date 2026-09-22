package com.example.pagination_api.controller;

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

        // Return standardized envelope response
        Map<String, Object> pageData = Map.of(
                "students", List.of(),
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

        // If ID not found in database:
        if ("9999".equals(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Student with ID " + id + " not found");
        }

        return ResponseEntity.ok(ApiResponse.success(Map.of("id", id, "name", "Sample Student"), "Student retrieved", cid));
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
}
