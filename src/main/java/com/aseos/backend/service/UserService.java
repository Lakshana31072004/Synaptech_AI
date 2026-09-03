package com.aseos.backend.service;

import com.aseos.backend.dto.UserDto;
import com.aseos.backend.model.User;
import com.aseos.backend.model.PasswordResetToken;
import com.aseos.backend.repository.UserRepository;
import com.aseos.backend.repository.PasswordResetTokenRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordResetTokenRepository passwordResetTokenRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private ActivityLogService activityLogService;

    public UserDto findUserByUsername(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with username: " + username));
        return new UserDto(user);
    }

    public void changePassword(String username, String oldPassword, String newPassword) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with username: " + username));

        if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
            throw new BadCredentialsException("Invalid old password");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        activityLogService.logActivity(user, "PASSWORD_CHANGE", "User changed their password.");
    }

    public UserDto updateUsername(String oldUsername, String newUsername) {
        if (userRepository.findByUsername(newUsername).isPresent()) {
            throw new IllegalArgumentException("Username is already taken.");
        }

        User user = userRepository.findByUsername(oldUsername)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with username: " + oldUsername));

        user.setUsername(newUsername);
        User updatedUser = userRepository.save(user);
        activityLogService.logActivity(updatedUser, "USERNAME_UPDATE", "User changed their username from " + oldUsername + " to " + newUsername);
        return new UserDto(updatedUser);
    }

    public UserDto updateProfilePicture(String username, String fileUrl) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with username: " + username));
        user.setProfilePictureUrl(fileUrl);
        User updatedUser = userRepository.save(user);
        activityLogService.logActivity(updatedUser, "PROFILE_PICTURE_UPDATE", "User updated their profile picture.");
        return new UserDto(updatedUser);
    }

    public String createPasswordResetTokenForUser(String email) {
        User user = userRepository.findByUsername(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));
        String token = UUID.randomUUID().toString();
        PasswordResetToken myToken = new PasswordResetToken(token, user);
        passwordResetTokenRepository.save(myToken);
        return token;
    }

    public void resetPassword(String token, String newPassword) {
        PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(token)
                .orElseThrow(() -> new BadCredentialsException("Invalid token"));

        if (resetToken.isExpired()) {
            passwordResetTokenRepository.delete(resetToken);
            throw new BadCredentialsException("Token has expired");
        }

        User user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        activityLogService.logActivity(user, "PASSWORD_RESET", "User reset their password.");
        passwordResetTokenRepository.delete(resetToken);
    }
}
