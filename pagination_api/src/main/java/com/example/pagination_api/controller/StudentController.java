package com.example.pagination_api.controller;

import com.example.pagination_api.model.Student;
import com.example.pagination_api.service.StudentService;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;

@RestController
@RequestMapping("/api/students")
public class StudentController {

    private final StudentService studentService;
    private final CacheManager cacheManager;
    private static final Logger logger = LoggerFactory.getLogger(StudentController.class);

    public StudentController(StudentService studentService, CacheManager cacheManager) {
        this.studentService = studentService;
        this.cacheManager = cacheManager;
    }

    @PostMapping
    public ResponseEntity<Student> addStudent(@Valid @RequestBody Student student) {
        Student savedStudent = studentService.saveStudent(student);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedStudent);
    }

    @GetMapping
    public ResponseEntity<Page<Student>> getStudents(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "asc") String direction,
            @RequestParam(defaultValue = "") String search) {

        String normalizedSearch = search == null ? "" : search.trim();
        Cache studentsCache = cacheManager.getCache("students");
        String cacheKey = page + ":" + size + ":" + sortBy + ":" + direction + ":" + normalizedSearch;
        if (studentsCache != null && studentsCache.get(cacheKey) != null) {
            logger.info("Returning students from cache");
        } else {
            logger.info("Students cache miss");
        }

        Page<Student> students = studentService.getStudents(page, size, sortBy, direction, normalizedSearch);

        return ResponseEntity.ok(students);
    }
}