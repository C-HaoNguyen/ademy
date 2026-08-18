package com.example.academic_management_api.user.dto;

import com.example.academic_management_api.user.entity.Role;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class AdminUpdateUserRequest {
    @NotBlank
    private String fullName;

    @NotBlank
    private String email;

    @NotNull
    private Role role;

    public String getFullName() {
        return fullName;
    }

    public String getEmail() {
        return email;
    }

    public Role getRole() {
        return role;
    }
}
