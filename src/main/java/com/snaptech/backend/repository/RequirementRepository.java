package com.snaptech.backend.repository;

import com.snaptech.backend.model.Requirement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface RequirementRepository extends JpaRepository<Requirement, Long> {
    List<Requirement> findByProjectId(Long projectId);
    List<Requirement> findByProjectIdOrderByReqCodeAsc(Long projectId);
    Optional<Requirement> findByProjectIdAndReqCode(Long projectId, String reqCode);
    long countByProjectId(Long projectId);
}
