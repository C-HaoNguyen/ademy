package com.example.academic_management_api.category.service;

import com.example.academic_management_api.category.dto.CategoryRequest;
import com.example.academic_management_api.category.entity.Categories;
import com.example.academic_management_api.category.repository.CategoryRepository;
import com.example.academic_management_api.common.exception.NotFoundException;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CategoryService {

    private final CategoryRepository categoryRepository;

    public CategoryService(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    public List<Categories> getAllCategories() {
        return categoryRepository.findAll();
    }

    public ResponseEntity<?> createCategory(CategoryRequest request) {
        Categories category = new Categories();
        category.setCategoryName(request.getCategoryName());
        category.setDescription(request.getDescription());

        Categories saved = categoryRepository.save(category);

        return ResponseEntity.ok(saved);
    }

    public ResponseEntity<?> updateCategory(Integer id, CategoryRequest request) {
        Categories category = categoryRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy danh mục"));

        category.setCategoryName(request.getCategoryName());
        category.setDescription(request.getDescription());

        Categories saved = categoryRepository.save(category);

        return ResponseEntity.ok(saved);
    }

    public void deleteCategory(Integer id) {
        if (!categoryRepository.existsById(id)) {
            throw new NotFoundException("Không tìm thấy danh mục");
        }
        categoryRepository.deleteById(id);
    }
}
