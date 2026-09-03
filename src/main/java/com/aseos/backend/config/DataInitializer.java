package com.aseos.backend.config;

import com.aseos.backend.model.*;
import com.aseos.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.HashSet;
import java.util.Set;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private ProjectHealthRepository projectHealthRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        Role adminRole = roleRepository.findByName(RoleName.ROLE_ADMIN)
                .orElseGet(() -> roleRepository.save(new Role(RoleName.ROLE_ADMIN)));

        Role userRole = roleRepository.findByName(RoleName.ROLE_USER)
                .orElseGet(() -> roleRepository.save(new Role(RoleName.ROLE_USER)));

        if (userRepository.findByUsername("admin").isEmpty()) {
            User admin = new User();
            admin.setUsername("admin");
            admin.setPassword(passwordEncoder.encode("admin123"));
            Set<Role> roles = new HashSet<>();
            roles.add(adminRole);
            roles.add(userRole);
            admin.setRoles(roles);
            userRepository.save(admin);
        }

        if (userRepository.findByUsername("developer").isEmpty()) {
            User dev = new User();
            dev.setUsername("developer");
            dev.setPassword(passwordEncoder.encode("developer123"));
            dev.setRoles(Collections.singleton(userRole));
            userRepository.save(dev);
        }

        if (projectRepository.count() == 0) {
            Project alpha = projectRepository.save(new Project("Project Alpha"));
            Project beta = projectRepository.save(new Project("Project Beta"));

            ProjectHealth healthAlpha = new ProjectHealth();
            healthAlpha.setProject(alpha);
            healthAlpha.setRiskScore(35);
            healthAlpha.setBugTrend("decreasing");
            healthAlpha.setSprintVelocity(42);
            healthAlpha.setTechnicalDebt("low");
            healthAlpha.setCodeQualityIndex(88);
            healthAlpha.setTeamProductivity("high");
            healthAlpha.setProjectProgress(75);
            healthAlpha.setTimestamp(LocalDateTime.now());
            projectHealthRepository.save(healthAlpha);

            ProjectHealth healthBeta = new ProjectHealth();
            healthBeta.setProject(beta);
            healthBeta.setRiskScore(60);
            healthBeta.setBugTrend("stable");
            healthBeta.setSprintVelocity(30);
            healthBeta.setTechnicalDebt("medium");
            healthBeta.setCodeQualityIndex(72);
            healthBeta.setTeamProductivity("medium");
            healthBeta.setProjectProgress(40);
            healthBeta.setTimestamp(LocalDateTime.now());
            projectHealthRepository.save(healthBeta);
        }
    }
}