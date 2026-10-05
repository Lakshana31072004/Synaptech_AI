package com.snaptech.backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "architecture_components")
public class ArchitectureComponent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "healthHistory"})
    private Project project;

    @Column(name = "component_name", length = 100, nullable = false)
    private String componentName;

    @Column(length = 50, nullable = false)
    private String layer = "DOMAIN"; // PRESENTATION, DOMAIN, DATA, INTEGRATION

    @Column(name = "technology_stack", length = 100)
    private String technologyStack = "Java/Spring Boot";

    @Column(name = "failure_criticality")
    private double failureCriticality = 0.5;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    public ArchitectureComponent() {}

    public ArchitectureComponent(Project project, String componentName, String layer, String technologyStack, double failureCriticality) {
        this.project = project;
        this.componentName = componentName;
        this.layer = layer;
        this.technologyStack = technologyStack;
        this.failureCriticality = failureCriticality;
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Project getProject() {
        return project;
    }

    public void setProject(Project project) {
        this.project = project;
    }

    public String getComponentName() {
        return componentName;
    }

    public void setComponentName(String componentName) {
        this.componentName = componentName;
    }

    public String getLayer() {
        return layer;
    }

    public void setLayer(String layer) {
        this.layer = layer;
    }

    public String getTechnologyStack() {
        return technologyStack;
    }

    public void setTechnologyStack(String technologyStack) {
        this.technologyStack = technologyStack;
    }

    public double getFailureCriticality() {
        return failureCriticality;
    }

    public void setFailureCriticality(double failureCriticality) {
        this.failureCriticality = failureCriticality;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
