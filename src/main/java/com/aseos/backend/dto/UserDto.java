package com.aseos.backend.dto;

import java.util.Set;
import java.util.stream.Collectors;
import com.aseos.backend.model.User;

public class UserDto {
    private Long id;
    private String username;
    private Set<String> roles;
    private String profilePictureUrl;

    public UserDto(User user) {
        this.id = user.getId();
        this.username = user.getUsername();
        this.roles = user.getRoles().stream()
                .map(role -> role.getName().name())
                .collect(Collectors.toSet());
        this.profilePictureUrl = user.getProfilePictureUrl();
    }

    public Long getId() {
        return id;
    }

    public String getUsername() {
        return username;
    }

    public Set<String> getRoles() {
        return roles;
    }

    public String getProfilePictureUrl() {
        return profilePictureUrl;
    }
}