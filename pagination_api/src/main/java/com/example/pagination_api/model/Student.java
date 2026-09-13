package com.example.pagination_api.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

@Document(collection = "students")
public class Student {

    @Id
    private String id;

    @Indexed
    @NotBlank(message = "name is required")
    private String name;

    @Indexed
    @Min(value = 1, message = "age must be at least 1")
    @Max(value = 150, message = "age must be at most 150")
    private int age;

    @Indexed
    @NotBlank(message = "course is required")
    private String course;

    public Student() {
    }

    public Student(String name, int age, String course) {
        this.name = name;
        this.age = age;
        this.course = course;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public int getAge() {
        return age;
    }

    public void setAge(int age) {
        this.age = age;
    }

    public String getCourse() {
        return course;
    }

    public void setCourse(String course) {
        this.course = course;
    }
}