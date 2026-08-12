package com.example.academic_management_api.controller;

import com.example.academic_management_api.security.JwtTokenUtil;
import com.example.academic_management_api.dto.auth.AuthResponse;
import com.example.academic_management_api.dto.auth.LoginRequest;
import com.example.academic_management_api.dto.auth.SignupRequest;
import com.example.academic_management_api.entity.Users;
import com.example.academic_management_api.repository.UserRepository;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private JwtTokenUtil jwtTokenUtil;

    public AuthController (UserRepository userRepository, PasswordEncoder passwordEncoder, JwtTokenUtil jwtTokenUtil) {
        this.jwtTokenUtil = jwtTokenUtil;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @PostMapping("/signup")
    @ResponseBody
    public ResponseEntity<?> signup(@Valid @RequestBody SignupRequest request) {
        if (userRepository.existsByUsername(request.getSignupUsername())) {
            return ResponseEntity.badRequest().body("Người dùng đã tồn tại. Vui lòng chọn tên khác!");
        }

        if (userRepository.existsByEmail(request.getSignupEmail())) {
            return ResponseEntity.badRequest().body("Email đã tồn tại. Vui lòng chọn email khác");
        }

        Users user = new Users();
        user.setUsername(request.getSignupUsername());
        user.setFullName(request.getSignupFullName());
        user.setEmail(request.getSignupEmail());
        user.setPasswordHash(passwordEncoder.encode(request.getSignupPassword()));
        user.setRole("STUDENT");
        user.setActive(true);

        userRepository.save(user);

        return ResponseEntity.ok("Đăng ký thành công");
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {

        Users user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        if (!user.getActive()) {
            return ResponseEntity.badRequest().body("Người dùng đã bị vô hiệu hóa");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            return ResponseEntity.badRequest().body("Tên đăng nhập hoặc mật khẩu không đúng");
        }

        String accessToken = jwtTokenUtil.generateAccessToken(
                user.getUsername(),
                user.getRole()
        );

        String refreshToken = jwtTokenUtil.generateRefreshToken(user.getUsername());

        AuthResponse response = new AuthResponse(
                user.getUserId(),
                user.getUsername(),
                user.getRole(),
                accessToken,
                refreshToken
        );

        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(Authentication authentication) {
        return ResponseEntity.ok(
                Map.of(
                        "username", authentication.getName(),
                        "roles", authentication.getAuthorities()
                )
        );
    }
}
