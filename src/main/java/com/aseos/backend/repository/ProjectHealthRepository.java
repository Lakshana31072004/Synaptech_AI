package com.aseos.backend.repository;

import com.aseos.backend.model.ProjectHealth;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ProjectHealthRepository extends JpaRepository<ProjectHealth, Long> {
    Optional<ProjectHealth> findTopByProjectIdOrderByTimestampDesc(Long projectId);
    List<ProjectHealth> findByProjectIdOrderByTimestampDesc(Long projectId);
}