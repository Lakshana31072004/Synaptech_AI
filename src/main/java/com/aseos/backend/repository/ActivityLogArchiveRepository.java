package com.aseos.backend.repository;

import com.aseos.backend.model.ActivityLogArchive;
import com.aseos.backend.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ActivityLogArchiveRepository extends JpaRepository<ActivityLogArchive, Long> {
    Page<ActivityLogArchive> findByUserOrderByTimestampDesc(User user, Pageable pageable);
}