package com.example.academic_management_api.dto.auth;

public class AuthResponse {
    private Integer userId;
    private String username;
    private String role;
    private String accessToken;
    private String refreshToken;

    public AuthResponse() {
    }

    public AuthResponse(Integer userId, String username, String role, String accessToken, String refreshToken) {
        this.userId = userId;
        this.username = username;
        this.role = role;
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
    }

    public Integer getUserId() {
        return userId;
    }

    public String getUsername() {
        return username;
    }

    public String getRole() {
        return role;
    }

    public String getAccessToken() {
        return accessToken;
    }

    public String getRefreshToken() {
        return refreshToken;
    }
}
