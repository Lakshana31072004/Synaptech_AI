package com.snaptech.backend.repository;

import com.snaptech.backend.model.TraceabilityLink;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TraceabilityLinkRepository extends JpaRepository<TraceabilityLink, Long> {
    List<TraceabilityLink> findByProjectId(Long projectId);
    List<TraceabilityLink> findByProjectIdAndSourceArtifactIdAndSourceArtifactType(Long projectId, Long sourceId, String sourceType);
    List<TraceabilityLink> findByProjectIdAndTargetArtifactIdAndTargetArtifactType(Long projectId, Long targetId, String targetType);

    @Query("SELECT t FROM TraceabilityLink t WHERE t.project.id = :projectId AND (t.sourceArtifactId = :artifactId OR t.targetArtifactId = :artifactId)")
    List<TraceabilityLink> findConnectedLinks(@Param("projectId") Long projectId, @Param("artifactId") Long artifactId);
}
