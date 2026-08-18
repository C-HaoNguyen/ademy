package com.example.academic_management_api.user.dto;

import jakarta.validation.constraints.NotBlank;

public class AdminUpdateUserRequest {
    @NotBlank
    private String fullName;

    @NotBlank
    private String email;

    @NotBlank
    private String role;

    public String getFullName() {
        return fullName;
    }

    public String getEmail() {
        return email;
    }

    public String getRole() {
        return role;
    }
}
