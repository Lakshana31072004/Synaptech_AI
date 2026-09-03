package com.aseos.backend.dto;

import com.aseos.backend.model.ActivityLog;
import java.time.LocalDateTime;

public class ActivityLogDto {

    private Long id;
    private String action;
    private LocalDateTime timestamp;
    private String details;

    public ActivityLogDto(ActivityLog log) {
        this.id = log.getId();
        this.action = log.getAction();
        this.timestamp = log.getTimestamp();
        this.details = log.getDetails();
    }

    public Long getId() {
        return id;
    }

    public String getAction() {
        return action;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public String getDetails() {
        return details;
    }
}