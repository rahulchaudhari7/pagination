package com.example.pagination_api.repository;

import com.example.pagination_api.model.Student;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface StudentRepository extends MongoRepository<Student, String> {

    Page<Student> findByNameContainingIgnoreCaseOrCourseContainingIgnoreCaseOrIdContainingIgnoreCase(
            String name,
            String course,
            String id,
            Pageable pageable);
}