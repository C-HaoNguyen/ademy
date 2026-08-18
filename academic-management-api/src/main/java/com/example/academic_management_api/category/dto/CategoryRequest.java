package com.example.academic_management_api.category.dto;

import jakarta.validation.constraints.NotBlank;

public class CategoryRequest {
    @NotBlank
    private String categoryName;

    private String description;

    public String getCategoryName() {
        return categoryName;
    }

    public String getDescription() {
        return description;
    }
}
