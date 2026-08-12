package com.example.academic_management_api.controller;

import com.example.academic_management_api.dto.user.UpdateProfileRequest;
import com.example.academic_management_api.dto.user.UserProfileResponse;
import com.example.academic_management_api.entity.Users;
import com.example.academic_management_api.repository.UserRepository;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/users")
public class UserController {
    private final UserRepository userRepository;

    public UserController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping("/me")
    public UserProfileResponse getMyProfile(Authentication authentication) {

        String username = authentication.getName();

        Users user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return new UserProfileResponse(
                user.getUserId(),
                user.getUsername(),
                user.getFullName(),
                user.getEmail(),
                user.getRole().toUpperCase(),
                user.getActive() ? "ACTIVE" : "BLOCKED",
                user.getCreatedAt(),
                user.getUpdatedAt()
        );
    }

    @PutMapping("/me/update")
    public UserProfileResponse updateMyProfile(
            @Valid @RequestBody UpdateProfileRequest request,
            Authentication authentication
    ) {
        String currentUsername = authentication.getName();

        Users user = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        // Check username trùng (trừ chính mình)
        if (!user.getUsername().equals(request.getUsername())
                && userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("Người dùng đã tồn tại");
        }

        // Check email trùng
        if (!user.getEmail().equals(request.getEmail())
                && userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email đã được sử dụng");
        }

        user.setUsername(request.getUsername());
        user.setFullName(request.getFullName());
        user.setEmail(request.getEmail());

        Users savedUser = userRepository.save(user);

        return new UserProfileResponse(
                savedUser.getUserId(),
                savedUser.getUsername(),
                savedUser.getFullName(),
                savedUser.getEmail(),
                savedUser.getRole().toUpperCase(),
                savedUser.getActive() ? "ACTIVE" : "INACTIVE",
                savedUser.getCreatedAt(),
                savedUser.getUpdatedAt()
        );
    }
}
