package com.example.academic_management_api.category.repository;

import com.example.academic_management_api.category.entity.Categories;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CategoryRepository extends JpaRepository<Categories, Integer> {

}
