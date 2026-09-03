package com.aseos.backend.dto;

import java.util.List;

public class GlobalSearchResultDto {

    private List<UserDto> users;
    private List<ActivityLogDto> activityLogs;
    private List<ActivityLogArchiveDto> archivedActivityLogs;

    // Constructors, Getters, and Setters
    public GlobalSearchResultDto(List<UserDto> users, List<ActivityLogDto> activityLogs, List<ActivityLogArchiveDto> archivedActivityLogs) {
        this.users = users;
        this.activityLogs = activityLogs;
        this.archivedActivityLogs = archivedActivityLogs;
    }

    public List<UserDto> getUsers() {
        return users;
    }

    public List<ActivityLogDto> getActivityLogs() {
        return activityLogs;
    }

    public List<ActivityLogArchiveDto> getArchivedActivityLogs() {
        return archivedActivityLogs;
    }
}