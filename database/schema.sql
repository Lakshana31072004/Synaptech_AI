-- Users table
CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255),
    password VARCHAR(255),
    profile_picture_url VARCHAR(255)
);

-- Roles table
CREATE TABLE roles (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

-- User-Roles join table
CREATE TABLE user_roles (
    user_id BIGINT NOT NULL,
    role_id BIGINT NOT NULL,
    PRIMARY KEY (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (role_id) REFERENCES roles(id)
);

-- ActivityLog table
CREATE TABLE activity_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    action VARCHAR(255) NOT NULL,
    `timestamp` DATETIME NOT NULL,
    details VARCHAR(255),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- PasswordResetToken table
CREATE TABLE password_reset_tokens (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    token VARCHAR(255),
    user_id BIGINT NOT NULL,
    expiry_date DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Project table
CREATE TABLE project (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255)
);

-- ProjectHealth table
CREATE TABLE project_health (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    project_id BIGINT,
    risk_score INT,
    bug_trend VARCHAR(255),
    sprint_velocity INT,
    technical_debt VARCHAR(255),
    code_quality_index INT,
    team_productivity VARCHAR(255),
    project_progress INT,
    `timestamp` DATETIME,
    FOREIGN KEY (project_id) REFERENCES project(id)
);
