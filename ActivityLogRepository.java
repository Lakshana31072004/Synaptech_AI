package com.aseos.backend.repository;

import com.aseos.backend.model.ActivityLog;
import com.aseos.backend.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ActivityLogRepository extends JpaRepository<ActivityLog, Long> {
    Page<ActivityLog> findByUserOrderByTimestampDesc(User user, Pageable pageable);
}