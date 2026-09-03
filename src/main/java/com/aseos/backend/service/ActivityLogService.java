package com.aseos.backend.service;

import com.aseos.backend.dto.ActivityLogDto;
import com.aseos.backend.model.ActivityLog;
import com.aseos.backend.model.User;
import com.aseos.backend.repository.ActivityLogRepository;
import com.aseos.backend.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;

@Service
public class ActivityLogService {

    @Autowired
    private ActivityLogRepository activityLogRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ObjectMapper objectMapper; // For converting details map to JSON

    @Autowired(required = false)
    private SimpMessageSendingOperations messagingTemplate;

    public void logActivity(String activityType, Map<String, Object> details) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));

        ActivityLog log = new ActivityLog();
        log.setUser(user);
        log.setAction(activityType);
        log.setTimestamp(LocalDateTime.now());

        try {
            log.setDetails(objectMapper.writeValueAsString(details));
        } catch (Exception e) {
            log.setDetails("{\"error\":\"Could not serialize details\"}");
        }
        ActivityLog savedLog = activityLogRepository.save(log);

        // Broadcast the new log to the WebSocket topic if template is available
        if (messagingTemplate != null) {
            messagingTemplate.convertAndSend("/topic/recent-activity", new ActivityLogDto(savedLog));
        }
    }

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