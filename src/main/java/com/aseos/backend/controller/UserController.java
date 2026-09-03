package com.aseos.backend.controller;

import com.aseos.backend.dto.ChangePasswordRequest;
import com.aseos.backend.dto.AuthResponse;
import com.aseos.backend.dto.UserDto;
import com.aseos.backend.dto.UsernameUpdateRequest;
import com.aseos.backend.service.UserService;
import com.aseos.backend.service.FileStorageService;
import com.aseos.backend.security.JwtTokenProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "http://localhost:3000")
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private FileStorageService fileStorageService;

    @Autowired
    private JwtTokenProvider tokenProvider;

    @GetMapping("/me")
    public ResponseEntity<UserDto> getCurrentUser(Authentication authentication) {
        return ResponseEntity.ok(userService.findUserByUsername(authentication.getName()));
    }

    @PostMapping("/me/change-password")
    public ResponseEntity<?> changePassword(@RequestBody ChangePasswordRequest request, Authentication authentication) {
        userService.changePassword(authentication.getName(), request.getOldPassword(), request.getNewPassword());
        return ResponseEntity.ok("Password changed successfully.");
    }

    @PostMapping("/me/change-username")
    public ResponseEntity<?> changeUsername(@RequestBody UsernameUpdateRequest request, Authentication authentication) {
        UserDto updatedUser = userService.updateUsername(authentication.getName(), request.getNewUsername());

        // Create a new Authentication object with the updated user details
        Authentication newAuthentication = new UsernamePasswordAuthenticationToken(updatedUser.getUsername(), null, authentication.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(newAuthentication);

        // Generate a new token with the new username
        String newJwt = tokenProvider.generateToken(newAuthentication);
        return ResponseEntity.ok(new AuthResponse(newJwt));
    }

    @PostMapping("/me/profile-picture")
    public ResponseEntity<UserDto> uploadProfilePicture(@RequestParam("file") MultipartFile file, Authentication authentication) {
        String fileUrl = fileStorageService.storeFile(file);
        UserDto updatedUser = userService.updateProfilePicture(authentication.getName(), fileUrl);
        return ResponseEntity.ok(updatedUser);
    }
}