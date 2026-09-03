package com.aseos.backend.dto;

import com.aseos.backend.model.ActivityLogArchive;
import java.time.LocalDateTime;

public class ActivityLogArchiveDto {

    private Long id;
    private String username;
    private String action;
    private LocalDateTime timestamp;
    private String details;

    public ActivityLogArchiveDto(ActivityLogArchive log) {
        this.id = log.getId();
        this.username = log.getUser().getUsername();
        this.action = log.getAction();
        this.timestamp = log.getTimestamp();
        this.details = log.getDetails();
    }

    // Getters
    public Long getId() { return id; }
    public String getUsername() { return username; }
    public String getAction() { return action; }
    public LocalDateTime getTimestamp() { return timestamp; }
    public String getDetails() { return details; }
}