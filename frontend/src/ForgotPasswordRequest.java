package com.aseos.backend.dto;

public class ForgotPasswordRequest {
    private String email; // Assuming username is the email

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }
}