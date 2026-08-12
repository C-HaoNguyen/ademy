package com.example.academic_management_api.repository;

import com.example.academic_management_api.entity.Users;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<Users, Integer> {
    Optional<Users> findByUsername(String username);

    List<Users> findByRole(String role);

    boolean existsByUsername(String username);

    boolean existsByEmail(String email);

    boolean existsByRole(String role);
}
