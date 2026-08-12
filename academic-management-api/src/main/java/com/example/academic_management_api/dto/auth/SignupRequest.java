package com.example.academic_management_api.dto.auth;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public class SignupRequest {
    private String signupUsername;
    private String signupFullName;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String signupEmail;
    private String signupPassword;

    public SignupRequest() {
    }

    public SignupRequest(String signupUsername, String signupFullName, String signupEmail, String signupPassword) {
        this.signupUsername = signupUsername;
        this.signupFullName = signupFullName;
        this.signupEmail = signupEmail;
        this.signupPassword = signupPassword;
    }

    public String getSignupUsername() {
        return signupUsername;
    }

    public void setSignupUsername(String signupUsername) {
        this.signupUsername = signupUsername;
    }

    public String getSignupFullName() {
        return signupFullName;
    }

    public void setSignupFullName(String signupFullName) {
        this.signupFullName = signupFullName;
    }

    public String getSignupEmail() {
        return signupEmail;
    }

    public void setSignupEmail(String signupEmail) {
        this.signupEmail = signupEmail;
    }

    public String getSignupPassword() {
        return signupPassword;
    }

    public void setSignupPassword(String signupPassword) {
        this.signupPassword = signupPassword;
    }
}
