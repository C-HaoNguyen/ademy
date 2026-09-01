package com.example.academic_management_api.auth.service;

import com.example.academic_management_api.audit.annotation.Audited;
import com.example.academic_management_api.auth.dto.AuthResponse;
import com.example.academic_management_api.auth.dto.LoginRequest;
import com.example.academic_management_api.auth.dto.SignupRequest;
import com.example.academic_management_api.common.exception.NotFoundException;
import com.example.academic_management_api.security.JwtTokenUtil;
import com.example.academic_management_api.user.entity.Role;
import com.example.academic_management_api.user.entity.Users;
import com.example.academic_management_api.user.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenUtil jwtTokenUtil;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtTokenUtil jwtTokenUtil) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenUtil = jwtTokenUtil;
    }

    public ResponseEntity<?> signup(SignupRequest request) {
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
        user.setRole(Role.STUDENT);
        user.setActive(true);

        userRepository.save(user);

        return ResponseEntity.ok("Đăng ký thành công");
    }

    @Audited(
            action = "AUTH_LOGIN",
            targetType = "USER",
            targetIdExpression = "#result.body.userId",
            actorExpression = "#request.username"
    )
    public ResponseEntity<?> login(LoginRequest request) {

        Users user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new NotFoundException("Không tìm thấy người dùng"));

        if (!user.getActive()) {
            return ResponseEntity.badRequest().body("Người dùng đã bị vô hiệu hóa");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            return ResponseEntity.badRequest().body("Tên đăng nhập hoặc mật khẩu không đúng");
        }

        String accessToken = jwtTokenUtil.generateAccessToken(
                user.getUsername(),
                user.getRole().name()
        );

        String refreshToken = jwtTokenUtil.generateRefreshToken(user.getUsername());

        AuthResponse response = new AuthResponse(
                user.getUserId(),
                user.getUsername(),
                user.getRole().name(),
                accessToken,
                refreshToken
        );

        return ResponseEntity.ok(response);
    }
}
