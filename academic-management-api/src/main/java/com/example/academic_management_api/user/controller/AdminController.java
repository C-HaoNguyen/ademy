package com.example.academic_management_api.user.controller;

import com.example.academic_management_api.user.dto.AdminCreateUserRequest;
import com.example.academic_management_api.user.dto.AdminInviteTeacherRequest;
import com.example.academic_management_api.user.dto.AdminUpdateUserRequest;
import com.example.academic_management_api.user.entity.Users;
import com.example.academic_management_api.user.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin")
public class AdminController {
    private final UserService userService;

    public AdminController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/users/add")
    public ResponseEntity<?> createUser(
            @Valid @RequestBody AdminCreateUserRequest request
    ) {
        return userService.createUser(request);
    }

    @PostMapping("/teachers")
    public ResponseEntity<?> inviteTeacher(
            @Valid @RequestBody AdminInviteTeacherRequest request
    ) {
        return userService.inviteTeacher(request);
    }

    @GetMapping("/users")
    public List<Users> getAllUsers() {
        return userService.getAllUsers();
    }

    @PutMapping("/users/{id}/lock")
    public ResponseEntity<?> lockUser(
            @PathVariable Integer id,
            Authentication authentication
    ) {
        return userService.lockUser(id, authentication.getName());
    }

    @PutMapping("/users/{id}/unlock")
    public ResponseEntity<?> unlockUser(@PathVariable Integer id) {
        return userService.unlockUser(id);
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<?> updateUser(
            @PathVariable Integer id,
            @Valid @RequestBody AdminUpdateUserRequest request
    ) {
        return userService.updateUser(id, request);
    }

    @GetMapping("/total-users")
    public ResponseEntity<?> getTotalUsers(Authentication authentication) {
        long totalUsers = userService.getTotalUsers();

        return ResponseEntity.ok(
                Map.of("totalUsers", totalUsers)
        );
    }

    @GetMapping("/instructors")
    public List<Users> getAllInstructors() {
        return userService.getAllInstructors();
    }

    @DeleteMapping("/deleted-user")
    public void deleteUser(@RequestBody Users user) {
        userService.deleteUser(user.getUserId());
    }
}
