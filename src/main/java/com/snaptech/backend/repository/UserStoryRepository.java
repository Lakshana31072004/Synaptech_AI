package com.snaptech.backend.repository;

import com.snaptech.backend.model.UserStory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface UserStoryRepository extends JpaRepository<UserStory, Long> {
    List<UserStory> findByProjectId(Long projectId);
    List<UserStory> findByProjectIdAndSprintNumber(Long projectId, Integer sprintNumber);
    List<UserStory> findByRequirementId(Long requirementId);
    long countByProjectId(Long projectId);
}
