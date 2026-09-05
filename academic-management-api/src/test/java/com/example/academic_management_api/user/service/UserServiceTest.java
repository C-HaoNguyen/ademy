package com.example.academic_management_api.user.service;

import com.example.academic_management_api.user.entity.Role;
import com.example.academic_management_api.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

// Phase 29 — AdminDashboard "Tổng Teacher". Chỉ test method mới thêm ở phase này, không mở rộng
// coverage cho phần còn lại của UserService (ngoài scope Phase 29).
@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private PasswordEncoder passwordEncoder;

    private UserService userService;

    @BeforeEach
    void setUp() {
        userService = new UserService(userRepository, passwordEncoder);
    }

    @Test
    void getTotalTeachers_returnsCountFilteredByRole() {
        when(userRepository.countByRole(Role.TEACHER)).thenReturn(7L);

        long result = userService.getTotalTeachers();

        assertThat(result).isEqualTo(7L);
    }

    @Test
    void getTotalStudents_returnsCountFilteredByRole() {
        when(userRepository.countByRole(Role.STUDENT)).thenReturn(42L);

        long result = userService.getTotalStudents();

        assertThat(result).isEqualTo(42L);
    }
}
