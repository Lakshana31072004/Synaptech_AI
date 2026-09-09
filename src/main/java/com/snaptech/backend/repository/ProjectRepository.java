package com.snaptech.backend.repository;

import com.snaptech.backend.model.Project;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProjectRepository extends JpaRepository<Project, Long> {
    // Basic CRUD operations are inherited
}