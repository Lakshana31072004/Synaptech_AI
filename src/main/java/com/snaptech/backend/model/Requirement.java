package com.snaptech.backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "requirements")
public class Requirement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "healthHistory"})
    private Project project;

    @Column(name = "req_code", length = 50, nullable = false)
    private String reqCode;

    @Column(length = 255)
    private String title;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String description;

    @Column(length = 50, nullable = false)
    private String category = "FUNCTIONAL"; // FUNCTIONAL, SECURITY, PERFORMANCE, USABILITY, MAINTAINABILITY

    @Column(name = "ambiguity_score")
    private double ambiguityScore = 0.0;

    @Column(name = "quality_score")
    private double qualityScore = 1.0;

    @Column(name = "quality_status", length = 50)
    private String qualityStatus = "APPROVED"; // APPROVED, NEEDS_REVISION, REJECTED

    @Column(name = "embedding_reference", length = 255)
    private String embeddingReference;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    public Requirement() {}

    public Requirement(Project project, String reqCode, String title, String description, String category) {
        this.project = project;
        this.reqCode = reqCode;
        this.title = title;
        this.description = description;
        this.category = category;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
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

    public String getReqCode() {
        return reqCode;
    }

    public void setReqCode(String reqCode) {
        this.reqCode = reqCode;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public double getAmbiguityScore() {
        return ambiguityScore;
    }

    public void setAmbiguityScore(double ambiguityScore) {
        this.ambiguityScore = ambiguityScore;
    }

    public double getQualityScore() {
        return qualityScore;
    }

    public void setQualityScore(double qualityScore) {
        this.qualityScore = qualityScore;
    }

    public String getQualityStatus() {
        return qualityStatus;
    }

    public void setQualityStatus(String qualityStatus) {
        this.qualityStatus = qualityStatus;
    }

    public String getEmbeddingReference() {
        return embeddingReference;
    }

    public void setEmbeddingReference(String embeddingReference) {
        this.embeddingReference = embeddingReference;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
