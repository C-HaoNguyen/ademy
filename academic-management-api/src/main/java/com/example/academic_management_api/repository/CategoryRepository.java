package com.example.academic_management_api.repository;

import com.example.academic_management_api.entity.Categories;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CategoryRepository extends JpaRepository<Categories, Integer> {

}
