package com.snaptech.backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "traceability_links")
public class TraceabilityLink {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "healthHistory"})
    private Project project;

    @Column(name = "source_artifact_id", nullable = false)
    private Long sourceArtifactId;

    @Column(name = "source_artifact_type", length = 50, nullable = false)
    private String sourceArtifactType; // REQUIREMENT, USER_STORY, ARCH_COMPONENT, CODE_MODULE, TEST_CASE

    @Column(name = "source_artifact_code", length = 50)
    private String sourceArtifactCode;

    @Column(name = "target_artifact_id", nullable = false)
    private Long targetArtifactId;

    @Column(name = "target_artifact_type", length = 50, nullable = false)
    private String targetArtifactType;

    @Column(name = "target_artifact_code", length = 50)
    private String targetArtifactCode;

    @Column(name = "link_type", length = 50, nullable = false)
    private String linkType = "IMPLEMENTS"; // REFINES, IMPLEMENTS, ARCHITECTED_AS, TESTS, DEPENDS_ON

    @Column(name = "weight")
    private double weight = 1.0;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    public TraceabilityLink() {}

    public TraceabilityLink(Project project, Long sourceId, String sourceType, String sourceCode,
                            Long targetId, String targetType, String targetCode, String linkType, double weight) {
        this.project = project;
        this.sourceArtifactId = sourceId;
        this.sourceArtifactType = sourceType;
        this.sourceArtifactCode = sourceCode;
        this.targetArtifactId = targetId;
        this.targetArtifactType = targetType;
        this.targetArtifactCode = targetCode;
        this.linkType = linkType;
        this.weight = weight;
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

    public Long getSourceArtifactId() {
        return sourceArtifactId;
    }

    public void setSourceArtifactId(Long sourceArtifactId) {
        this.sourceArtifactId = sourceArtifactId;
    }

    public String getSourceArtifactType() {
        return sourceArtifactType;
    }

    public void setSourceArtifactType(String sourceArtifactType) {
        this.sourceArtifactType = sourceArtifactType;
    }

    public String getSourceArtifactCode() {
        return sourceArtifactCode;
    }

    public void setSourceArtifactCode(String sourceArtifactCode) {
        this.sourceArtifactCode = sourceArtifactCode;
    }

    public Long getTargetArtifactId() {
        return targetArtifactId;
    }

    public void setTargetArtifactId(Long targetArtifactId) {
        this.targetArtifactId = targetArtifactId;
    }

    public String getTargetArtifactType() {
        return targetArtifactType;
    }

    public void setTargetArtifactType(String targetArtifactType) {
        this.targetArtifactType = targetArtifactType;
    }

    public String getTargetArtifactCode() {
        return targetArtifactCode;
    }

    public void setTargetArtifactCode(String targetArtifactCode) {
        this.targetArtifactCode = targetArtifactCode;
    }

    public String getLinkType() {
        return linkType;
    }

    public void setLinkType(String linkType) {
        this.linkType = linkType;
    }

    public double getWeight() {
        return weight;
    }

    public void setWeight(double weight) {
        this.weight = weight;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
