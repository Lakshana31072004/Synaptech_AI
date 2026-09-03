package com.aseos.backend.repository;

import com.aseos.backend.model.ProjectHealth;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProjectHealthRepository extends JpaRepository<ProjectHealth, Long> {
    // Spring Data JPA will automatically implement basic CRUD operations.
    // We can add custom query methods here if needed later.
}