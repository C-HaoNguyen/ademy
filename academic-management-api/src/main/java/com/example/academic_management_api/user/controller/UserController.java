package com.example.academic_management_api.user.controller;

import com.example.academic_management_api.user.dto.UpdateProfileRequest;
import com.example.academic_management_api.user.dto.UserProfileResponse;
import com.example.academic_management_api.user.service.UserService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/users")
public class UserController {
    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/me")
    public UserProfileResponse getMyProfile(Authentication authentication) {
        return userService.getMyProfile(authentication.getName());
    }

    @PutMapping("/me/update")
    public UserProfileResponse updateMyProfile(
            @Valid @RequestBody UpdateProfileRequest request,
            Authentication authentication
    ) {
        return userService.updateMyProfile(authentication.getName(), request);
    }
}
