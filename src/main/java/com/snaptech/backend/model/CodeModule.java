package com.snaptech.backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "code_modules")
public class CodeModule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "healthHistory"})
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "architecture_component_id")
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "project"})
    private ArchitectureComponent architectureComponent;

    @Column(name = "module_path", length = 255, nullable = false)
    private String modulePath;

    @Column(name = "loc")
    private int loc = 0;

    @Column(name = "cyclomatic_complexity")
    private double cyclomaticComplexity = 1.0;

    @Column(name = "halstead_volume")
    private double halsteadVolume = 0.0;

    @Column(name = "technical_debt_hours")
    private double technicalDebtHours = 0.0;

    @Column(name = "code_quality_index")
    private double codeQualityIndex = 80.0;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    public CodeModule() {}

    public CodeModule(Project project, ArchitectureComponent arch, String modulePath, int loc, double complexity, double debt) {
        this.project = project;
        this.architectureComponent = arch;
        this.modulePath = modulePath;
        this.loc = loc;
        this.cyclomaticComplexity = complexity;
        this.technicalDebtHours = debt;
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

    public ArchitectureComponent getArchitectureComponent() {
        return architectureComponent;
    }

    public void setArchitectureComponent(ArchitectureComponent architectureComponent) {
        this.architectureComponent = architectureComponent;
    }

    public String getModulePath() {
        return modulePath;
    }

    public void setModulePath(String modulePath) {
        this.modulePath = modulePath;
    }

    public int getLoc() {
        return loc;
    }

    public void setLoc(int loc) {
        this.loc = loc;
    }

    public double getCyclomaticComplexity() {
        return cyclomaticComplexity;
    }

    public void setCyclomaticComplexity(double cyclomaticComplexity) {
        this.cyclomaticComplexity = cyclomaticComplexity;
    }

    public double getHalsteadVolume() {
        return halsteadVolume;
    }

    public void setHalsteadVolume(double halsteadVolume) {
        this.halsteadVolume = halsteadVolume;
    }

    public double getTechnicalDebtHours() {
        return technicalDebtHours;
    }

    public void setTechnicalDebtHours(double technicalDebtHours) {
        this.technicalDebtHours = technicalDebtHours;
    }

    public double getCodeQualityIndex() {
        return codeQualityIndex;
    }

    public void setCodeQualityIndex(double codeQualityIndex) {
        this.codeQualityIndex = codeQualityIndex;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
