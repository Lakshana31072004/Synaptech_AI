package com.aseos.backend.repository;

import com.aseos.backend.model.Project;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProjectRepository extends JpaRepository<Project, Long> {
    // Basic CRUD operations are inherited
}