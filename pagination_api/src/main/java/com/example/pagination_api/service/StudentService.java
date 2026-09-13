package com.example.pagination_api.service;

import com.example.pagination_api.model.Student;
import com.example.pagination_api.repository.StudentRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Set;

@Service
public class StudentService {

    private static final int MAX_PAGE_SIZE = 100;
    private static final Set<String> SORTABLE_FIELDS = Set.of("id", "name", "age", "course");
    private static final Logger logger = LoggerFactory.getLogger(StudentService.class);

    private final StudentRepository studentRepository;

    public StudentService(StudentRepository studentRepository) {
        this.studentRepository = studentRepository;
    }

    @CacheEvict(value = "students", allEntries = true)
    public Student saveStudent(Student student) {
        return studentRepository.save(student);
    }

    @Cacheable(value = "students", key = "#page + ':' + #size + ':' + #sortBy + ':' + #direction + ':' + #search")
    public Page<Student> getStudents(
            int page,
            int size,
            String sortBy,
            String direction,
            String search) {

        logger.info("Fetching students from MongoDB");

        if (page < 0) {
            throw badRequest("page must be greater than or equal to 0");
        }
        if (size < 1 || size > MAX_PAGE_SIZE) {
            throw badRequest("size must be between 1 and " + MAX_PAGE_SIZE);
        }
        if (sortBy == null || !SORTABLE_FIELDS.contains(sortBy)) {
            throw badRequest("sortBy must be one of: id, name, age, course");
        }

        Sort sort;

        if ("desc".equalsIgnoreCase(direction)) {
            sort = Sort.by(sortBy).descending();
        } else if ("asc".equalsIgnoreCase(direction)) {
            sort = Sort.by(sortBy).ascending();
        } else {
            throw badRequest("direction must be either asc or desc");
        }

        Pageable pageable = PageRequest.of(page, size, sort);

        String normalizedSearch = search == null ? "" : search.trim();
        if (normalizedSearch.isEmpty()) {
            return studentRepository.findAll(pageable);
        }

        return studentRepository.findByNameContainingIgnoreCaseOrCourseContainingIgnoreCaseOrIdContainingIgnoreCase(
                normalizedSearch, normalizedSearch, normalizedSearch, pageable);
    }

    private ResponseStatusException badRequest(String message) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }
}