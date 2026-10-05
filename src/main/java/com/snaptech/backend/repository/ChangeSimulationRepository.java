package com.snaptech.backend.repository;

import com.snaptech.backend.model.ChangeSimulation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ChangeSimulationRepository extends JpaRepository<ChangeSimulation, Long> {
    List<ChangeSimulation> findByProjectId(Long projectId);
    List<ChangeSimulation> findByProjectIdOrderByExecutedAtDesc(Long projectId);
}
