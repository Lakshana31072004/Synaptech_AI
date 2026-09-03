package com.aseos.backend.controller;

import com.aseos.backend.dto.AuthRequest;
import com.aseos.backend.dto.AuthResponse;
import com.aseos.backend.dto.ForgotPasswordRequest;
import com.aseos.backend.dto.ResetPasswordRequest;
import com.aseos.backend.model.User;
import com.aseos.backend.model.Role;
import com.aseos.backend.model.RoleName;
import com.aseos.backend.repository.RoleRepository;
import com.aseos.backend.service.ActivityLogService;
import com.aseos.backend.repository.UserRepository;
import com.aseos.backend.service.UserService;
import com.aseos.backend.security.JwtTokenProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Collections;
import java.util.HashSet;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:3000")
public class AuthController {

    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private ActivityLogService activityLogService;

    @Autowired
    private UserService userService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider tokenProvider;

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@RequestBody AuthRequest loginRequest) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword())
            );

            SecurityContextHolder.getContext().setAuthentication(authentication);
            String jwt = tokenProvider.generateToken(authentication);

            // Log successful login
            userRepository.findByUsername(loginRequest.getUsername()).ifPresent(user ->
                activityLogService.logActivity(user, "USER_LOGIN")
            );
            return ResponseEntity.ok(new AuthResponse(jwt));
        } catch (org.springframework.security.core.AuthenticationException e) {
            return ResponseEntity.status(401).body(java.util.Map.of(
                "error", "Unauthorized",
                "message", "Invalid username or password. Please check your credentials or register a new account."
            ));
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody AuthRequest signUpRequest) {
        if (userRepository.findByUsername(signUpRequest.getUsername()).isPresent()) {
            return ResponseEntity.badRequest().body("Username is already taken!");
        }

        // Create new user's account and assign default role
        User user = new User(signUpRequest.getUsername(), passwordEncoder.encode(signUpRequest.getPassword()), null);
        Role userRole = roleRepository.findByName(RoleName.ROLE_USER)
                .orElseThrow(() -> new RuntimeException("Error: Role is not found."));
        user.setRoles(Collections.singleton(userRole));
        User savedUser = userRepository.save(user);

        // Log successful registration
        activityLogService.logActivity(savedUser, "USER_REGISTER");
        return ResponseEntity.ok("User registered successfully!");
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody ForgotPasswordRequest forgotPasswordRequest) {
        try {
            String token = userService.createPasswordResetTokenForUser(forgotPasswordRequest.getEmail());
            String resetUrl = "http://localhost:3000/reset-password?token=" + token;

            // In a real application, you would use an email service here.
            // For this example, we log the URL to the console.
            logger.info("Password Reset URL: {}", resetUrl);

            return ResponseEntity.ok("A password reset link has been sent to your email (check console).");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody ResetPasswordRequest resetPasswordRequest) {
        userService.resetPassword(resetPasswordRequest.getToken(), resetPasswordRequest.getNewPassword());
        return ResponseEntity.ok("Password has been reset successfully.");
    }
}