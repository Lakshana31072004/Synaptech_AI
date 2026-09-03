package com.aseos.backend.repository;

import com.aseos.backend.model.ActivityLog;
import com.aseos.backend.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import java.util.List;
import java.time.LocalDateTime;

public interface ActivityLogRepository extends JpaRepository<ActivityLog, Long>, JpaSpecificationExecutor<ActivityLog> {
    Page<ActivityLog> findByUserOrderByTimestampDesc(User user, Pageable pageable);
    Page<ActivityLog> findAllByOrderByTimestampDesc(Pageable pageable);
    @Query("SELECT DISTINCT a.action FROM ActivityLog a ORDER BY a.action ASC")
    List<String> findDistinctActions();
    List<ActivityLog> findByTimestampBefore(LocalDateTime threshold);

    @Query(value = "SELECT al.* FROM activity_log al JOIN users u ON al.user_id = u.id WHERE similarity(al.action || ' ' || COALESCE(al.details, '') || ' ' || u.username, :query) > 0.15 ORDER BY similarity(al.action || ' ' || COALESCE(al.details, '') || ' ' || u.username, :query) DESC LIMIT :limit", nativeQuery = true)
    List<ActivityLog> findFuzzy(@Param("query") String query, @Param("limit") int limit);
}