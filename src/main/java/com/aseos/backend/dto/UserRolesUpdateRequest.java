package com.aseos.backend.dto;

import java.util.Set;

public class UserRolesUpdateRequest {
    private Set<String> roles;

    public Set<String> getRoles() {
        return roles;
    }

    public void setRoles(Set<String> roles) {
        this.roles = roles;
    }
}
