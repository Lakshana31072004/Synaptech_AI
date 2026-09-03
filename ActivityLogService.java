package com.aseos.backend.service;

import com.aseos.backend.model.ActivityLog;
import com.aseos.backend.model.User;
import com.aseos.backend.repository.ActivityLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class ActivityLogService {

    @Autowired
    private ActivityLogRepository activityLogRepository;

    public void logActivity(User user, String action) {
        logActivity(user, action, null);
    }

    public void logActivity(User user, String action, String details) {
        if (user != null) {
            ActivityLog log = new ActivityLog(user, action, details);
            activityLogRepository.save(log);
        }
    }
}