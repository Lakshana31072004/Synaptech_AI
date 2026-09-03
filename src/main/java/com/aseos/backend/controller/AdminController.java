package com.aseos.backend.controller;

import com.aseos.backend.dto.AuthResponse;
import com.aseos.backend.dto.ActivityLogDto;
import com.aseos.backend.dto.UserDto;
import com.aseos.backend.dto.UserRolesUpdateRequest;
import com.aseos.backend.service.AdminService;
import com.aseos.backend.security.JwtTokenProvider;
import com.aseos.backend.security.UserDetailsServiceImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "http://localhost:3000")
public class AdminController {

    @Autowired
    private AdminService adminService;

    @Autowired
    private UserDetailsServiceImpl userDetailsService;

    @Autowired
    private JwtTokenProvider tokenProvider;

    @GetMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<UserDto>> getAllUsers(@RequestParam(required = false) String username, Pageable pageable) {
        return ResponseEntity.ok(adminService.getAllUsers(username, pageable));
    }

    @PostMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createUser(@RequestBody Map<String, Object> body) {
        String username = (String) body.get("username");
        String password = (String) body.get("password");
        if (username == null || username.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Username cannot be empty.");
        }
        if (password == null || password.trim().length() < 4) {
            return ResponseEntity.badRequest().body("Password must be at least 4 characters long.");
        }
        @SuppressWarnings("unchecked")
        List<String> roles = (List<String>) body.get("roles");
        try {
            UserDto newUser = adminService.createUserByAdmin(username, password, roles);
            return ResponseEntity.ok(newUser);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/users/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteUser(@PathVariable Long id, Authentication authentication) {
        adminService.deleteUser(id, authentication.getName());
        return ResponseEntity.ok("User deleted successfully.");
    }

    @PutMapping("/users/{id}/roles")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserDto> updateUserRoles(@PathVariable Long id, @RequestBody UserRolesUpdateRequest request) {
        UserDto updatedUser = adminService.updateUserRoles(id, request.getRoles());
        return ResponseEntity.ok(updatedUser);
    }

    @PutMapping("/users/{id}/password")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> resetUserPasswordDirect(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String newPassword = body.get("newPassword");
        if (newPassword == null || newPassword.trim().length() < 4) {
            return ResponseEntity.badRequest().body("Password must be at least 4 characters long.");
        }
        adminService.resetPasswordDirect(id, newPassword);
        return ResponseEntity.ok(Map.of("message", "Password updated successfully."));
    }

    @GetMapping("/roles")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<String>> getAllRoles() {
        return ResponseEntity.ok(adminService.getAllRoles());
    }

    @PostMapping("/users/{id}/impersonate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> impersonateUser(@PathVariable Long id) {
        UserDto userDto = adminService.getAllUsers(null, Pageable.unpaged()).getContent().stream()
                .filter(u -> u.getId().equals(id)).findFirst().orElseThrow();
        UserDetails userDetails = userDetailsService.loadUserByUsername(userDto.getUsername());
        Authentication authentication = new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
        String jwt = tokenProvider.generateToken(authentication);
        return ResponseEntity.ok(new AuthResponse(jwt));
    }

    @PostMapping("/users/{id}/trigger-password-reset")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> triggerPasswordReset(@PathVariable Long id) {
        String resetToken = adminService.triggerPasswordReset(id);
        return ResponseEntity.ok("Password reset link generated. Token: " + resetToken + " (In a real app, this would be emailed.)");
    }

    @GetMapping("/users/{id}/activity")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<ActivityLogDto>> getUserActivity(@PathVariable Long id, Pageable pageable) {
        Page<ActivityLogDto> activityPage = adminService.getUserActivity(id, pageable);
        return ResponseEntity.ok(activityPage);
    }
}