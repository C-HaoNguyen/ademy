package com.example.academic_management_api.category.controller;

import com.example.academic_management_api.category.entity.Categories;
import com.example.academic_management_api.category.service.CategoryService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/categories")
public class CategoryController {
    private final CategoryService categoryService;

    public CategoryController(CategoryService categoryService) {
        this.categoryService = categoryService;
    }

    @GetMapping
    public List<Categories> getAllCategories() {
        return categoryService.getAllCategories();
    }
}
