package com.snaptech.backend.repository;

import com.snaptech.backend.model.ArchitectureComponent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ArchitectureComponentRepository extends JpaRepository<ArchitectureComponent, Long> {
    List<ArchitectureComponent> findByProjectId(Long projectId);
    Optional<ArchitectureComponent> findByProjectIdAndComponentName(Long projectId, String componentName);
    long countByProjectId(Long projectId);
}
