package com.snaptech.backend.repository;

import com.snaptech.backend.model.ProjectMetric;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectMetricRepository extends JpaRepository<ProjectMetric, Long> {
    List<ProjectMetric> findByProjectIdOrderByRecordedAtDesc(Long projectId);
    Optional<ProjectMetric> findFirstByProjectIdOrderByRecordedAtDesc(Long projectId);
}
