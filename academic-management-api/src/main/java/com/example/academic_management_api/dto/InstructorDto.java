package com.example.academic_management_api.dto;

public class InstructorDto {
    private String username;
    private String fullName;

    public InstructorDto(String username, String fullName) {
        this.username = username;
        this.fullName = fullName;
    }

    public String getUsername() {
        return username;
    }

    public String getFullName() {
        return fullName;
    }
}