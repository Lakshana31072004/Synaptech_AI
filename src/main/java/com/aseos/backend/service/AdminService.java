package com.aseos.backend.service;

import com.aseos.backend.dto.ActivityLogDto;
import com.aseos.backend.dto.UserDto;
import com.aseos.backend.repository.UserRepository;
import com.aseos.backend.repository.RoleRepository;
import com.aseos.backend.repository.ActivityLogRepository;
import com.aseos.backend.model.User;
import com.aseos.backend.service.UserService;
import com.aseos.backend.model.Role;
import com.aseos.backend.model.RoleName;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.stream.Collectors;
import java.util.Set;
import java.util.HashSet;
import java.util.Objects;

@Service
public class AdminService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private ActivityLogRepository activityLogRepository;

    @Autowired
    private UserService userService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public UserDto createUserByAdmin(String username, String password, List<String> roleNames) {
        if (userRepository.findByUsername(username).isPresent()) {
            throw new IllegalArgumentException("Username '" + username + "' is already taken.");
        }
        User user = new User();
        user.setUsername(username);
        user.setPassword(passwordEncoder.encode(password));

        Set<Role> roles = new HashSet<>();
        if (roleNames != null && !roleNames.isEmpty()) {
            for (String roleName : roleNames) {
                Role r = roleRepository.findByName(RoleName.valueOf(roleName))
                        .orElseThrow(() -> new RuntimeException("Role not found: " + roleName));
                roles.add(r);
            }
        } else {
            Role userRole = roleRepository.findByName(RoleName.ROLE_USER)
                    .orElseThrow(() -> new RuntimeException("Default ROLE_USER not found."));
            roles.add(userRole);
        }
        user.setRoles(roles);
        User saved = userRepository.save(user);
        return new UserDto(saved);
    }

    public void resetPasswordDirect(Long userId, String newPassword) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with id: " + userId));
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    public Page<UserDto> getAllUsers(String username, Pageable pageable) {
        if (username != null && !username.trim().isEmpty()) {
            return userRepository.findByUsernameContainingIgnoreCase(username, pageable).map(UserDto::new);
        } else {
            return userRepository.findAll(pageable).map(UserDto::new);
        }
    }

    public void deleteUser(Long userId, String currentUsername) {
        User userToDelete = userRepository.findById(userId)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with id: " + userId));

        if (Objects.equals(userToDelete.getUsername(), currentUsername)) {
            throw new IllegalArgumentException("Admin cannot delete their own account.");
        }
        userRepository.deleteById(userId);
    }

    public UserDto updateUserRoles(Long userId, Set<String> roleNames) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with id: " + userId));

        Set<Role> newRoles = roleNames.stream()
                .map(roleName -> roleRepository.findByName(RoleName.valueOf(roleName))
                        .orElseThrow(() -> new RuntimeException("Error: Role is not found.")))
                .collect(Collectors.toSet());

        user.setRoles(newRoles);
        User updatedUser = userRepository.save(user);
        return new UserDto(updatedUser);
    }

    public List<String> getAllRoles() {
        return roleRepository.findAll().stream().map(role -> role.getName().name()).collect(Collectors.toList());
    }

    public String triggerPasswordReset(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with id: " + userId));
        // Use UserService to create the token
        return userService.createPasswordResetTokenForUser(user.getUsername());
    }

    public Page<ActivityLogDto> getUserActivity(Long userId, Pageable pageable) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with id: " + userId));
        return activityLogRepository.findByUserOrderByTimestampDesc(user, pageable)
                .map(ActivityLogDto::new);
    }
}