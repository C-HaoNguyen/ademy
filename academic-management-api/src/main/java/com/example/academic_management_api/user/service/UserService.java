package com.example.academic_management_api.user.service;

import com.example.academic_management_api.common.exception.ConflictException;
import com.example.academic_management_api.common.exception.NotFoundException;
import com.example.academic_management_api.user.dto.AdminCreateUserRequest;
import com.example.academic_management_api.user.dto.AdminUpdateUserRequest;
import com.example.academic_management_api.user.dto.UpdateProfileRequest;
import com.example.academic_management_api.user.dto.UserProfileResponse;
import com.example.academic_management_api.user.entity.Users;
import com.example.academic_management_api.user.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public UserProfileResponse getMyProfile(String username) {

        Users user = userRepository.findByUsername(username)
                .orElseThrow(() -> new NotFoundException("User not found"));

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

    public UserProfileResponse updateMyProfile(String currentUsername, UpdateProfileRequest request) {
        Users user = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy người dùng"));

        // Check username trùng (trừ chính mình)
        if (!user.getUsername().equals(request.getUsername())
                && userRepository.existsByUsername(request.getUsername())) {
            throw new ConflictException("Người dùng đã tồn tại");
        }

        // Check email trùng
        if (!user.getEmail().equals(request.getEmail())
                && userRepository.existsByEmail(request.getEmail())) {
            throw new ConflictException("Email đã được sử dụng");
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

    // ---- Admin operations ----

    public ResponseEntity<?> createUser(AdminCreateUserRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            return ResponseEntity.badRequest().body("Người dùng đã tồn tại. Vui lòng chọn tên khác!");
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            return ResponseEntity.badRequest().body("Email đã tồn tại. Vui lòng chọn email khác");
        }

        Users user = new Users();
        user.setUsername(request.getUsername());
        user.setFullName(request.getFullName());
        user.setEmail(request.getEmail());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setRole(request.getRole());
        user.setActive(request.getActive() != null ? request.getActive() : true);

        Users saved = userRepository.save(user);

        return ResponseEntity.ok(saved);
    }

    public List<Users> getAllUsers() {
        List<Users> allUsers = userRepository.findAll();
        return allUsers;
    }

    public ResponseEntity<?> lockUser(Integer id, String currentUsername) {
        Users admin = userRepository
                .findByUsername(currentUsername)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy người dùng"));

        if (admin.getUserId().equals(id)) {
            return ResponseEntity.badRequest()
                    .body("Bạn không thể tự khóa tài khoản của chính mình");
        }

        Users user = userRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy người dùng"));

        user.setActive(false);
        userRepository.save(user);

        return ResponseEntity.ok().build();
    }

    public ResponseEntity<?> unlockUser(Integer id) {
        Users user = userRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy người dùng"));

        user.setActive(true);
        userRepository.save(user);

        return ResponseEntity.ok().build();
    }

    public ResponseEntity<?> updateUser(Integer id, AdminUpdateUserRequest request) {
        Users user = userRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy người dùng"));

        user.setFullName(request.getFullName());
        user.setEmail(request.getEmail());
        user.setRole(request.getRole());

        Users saved = userRepository.save(user);

        return ResponseEntity.ok(saved);
    }

    public long getTotalUsers() {
        return userRepository.count();
    }

    public List<Users> getAllInstructors() {
        return userRepository.findByRole("INSTRUCTOR");
    }

    public void deleteUser(Integer userId) {
        if (!userRepository.existsById(userId)) {
            throw new NotFoundException("Không tìm thấy người dùng");
        }
        userRepository.deleteById(userId);
    }
}
