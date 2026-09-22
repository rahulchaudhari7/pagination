package com.example.pagination_api.dto;

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
) {}
