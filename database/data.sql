-- Insert sample data into the ProjectHealth table
-- Insert sample data into the roles table
INSERT INTO roles (name) VALUES ('Admin'), ('Developer'), ('Project Manager');

-- Insert sample data into the users table
-- Passwords should be hashed in a real application. Storing plain text for example purposes only.
INSERT INTO users (username, password, profile_picture_url) VALUES 
('admin_user', 'secure_password_123', 'http://example.com/pic/admin.jpg'),
('dev_user', 'developer_pass', 'http://example.com/pic/dev.jpg'),
('pm_user', 'manager_pass', 'http://example.com/pic/pm.jpg');

-- Assign roles to users
INSERT INTO user_roles (user_id, role_id) VALUES (1, 1), (2, 2), (3, 3);

-- Insert sample data into the project table
INSERT INTO project (name) VALUES ('Project Alpha'), ('Project Beta');

-- Insert sample data into the ProjectHealth table
INSERT INTO project_health (project_id, risk_score, bug_trend, sprint_velocity, technical_debt, code_quality_index, team_productivity, project_progress, `timestamp`) VALUES 
(1, 78, 'decreasing', 35, 'medium', 85, 'high', 60, NOW()),
(2, 45, 'stable', 42, 'low', 92, 'high', 85, NOW());
