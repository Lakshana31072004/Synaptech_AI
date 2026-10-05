package com.snaptech.backend.repository;

import com.snaptech.backend.model.ProjectRiskPrediction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectRiskPredictionRepository extends JpaRepository<ProjectRiskPrediction, Long> {
    List<ProjectRiskPrediction> findByProjectIdOrderByPredictedAtDesc(Long projectId);
    Optional<ProjectRiskPrediction> findFirstByProjectIdOrderByPredictedAtDesc(Long projectId);
}
