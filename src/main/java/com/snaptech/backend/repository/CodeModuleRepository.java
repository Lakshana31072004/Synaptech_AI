package com.snaptech.backend.repository;

import com.snaptech.backend.model.CodeModule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CodeModuleRepository extends JpaRepository<CodeModule, Long> {
    List<CodeModule> findByProjectId(Long projectId);
    List<CodeModule> findByArchitectureComponentId(Long componentId);
    long countByProjectId(Long projectId);
}
