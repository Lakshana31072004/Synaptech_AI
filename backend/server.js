const express = require('express');
const mysql = require('mysql2');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-that-is-long-and-random';
const uploadDirectory = path.join(__dirname, 'uploads');

// Multer does not create its destination folder. Create it during startup so
// profile uploads work on a fresh checkout as well as an existing deployment.
fs.mkdirSync(uploadDirectory, { recursive: true });

// --- Multer Setup for File Uploads ---
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDirectory);
  },
  filename: function (req, file, cb) {
    cb(null, `${req.user.id}-${Date.now()}${path.extname(file.originalname)}`);
  }
});
const upload = multer({ storage: storage });

app.use(express.json()); // Middleware to parse JSON bodies
app.use('/uploads', express.static(uploadDirectory));

app.use((req, res, next) => {
  const allowedOrigin = 'http://localhost:3001';
  if (req.headers.origin === allowedOrigin) {
    res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  }
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

const fallbackUsers = [];

const findFallbackUser = (username) => fallbackUsers.find((user) => user.username === username);

// --- Database Connection ---
// Use environment variables so the DB configuration is not hard-coded into source control.
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'your_password',
  database: process.env.DB_NAME || 'project_health_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
}).promise();

const dbConfigSummary = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  database: process.env.DB_NAME || 'project_health_db',
};

console.log('Database config loaded:', dbConfigSummary);

// --- Authentication Middleware ---
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (token == null) {
    return res.sendStatus(401); // Unauthorized
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.sendStatus(403); // Forbidden
    }
    req.user = user;
    next();
  });
}

// --- Authorization Middleware (Role-Based Access Control) ---
function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !req.user.roles) {
      return res.status(403).send('Forbidden: No roles found for user.');
    }

    const userRoles = req.user.roles;
    const hasRequiredRole = userRoles.some(role => allowedRoles.includes(role));

    if (!hasRequiredRole) {
      return res.status(403).send('Forbidden: You do not have the required permissions.');
    }
    next();
  };
}

// --- Password Strength Validation ---
function isPasswordStrong(password) {
  // Regex: min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
  const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return strongPasswordRegex.test(password);
}

const passwordPolicyMessage = 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&).';

// --- API Endpoints ---

// A simple health check endpoint
app.get('/', (req, res) => {
  res.send('Backend server is running!');
});

// --- Auth Endpoints ---
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).send('Username and password are required.');
  }

  try {
    const [users] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
    if (users.length === 0) {
      const fallbackUser = findFallbackUser(username);
      if (!fallbackUser) {
        return res.status(401).send('Invalid credentials.');
      }

      const isMatch = await bcrypt.compare(password, fallbackUser.password);
      if (!isMatch) {
        return res.status(401).send('Invalid credentials.');
      }

      const payload = { username: fallbackUser.username, id: fallbackUser.id, roles: fallbackUser.roles || ['User'] };
      const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
      return res.json({ accessToken });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).send('Invalid credentials.');
    }

    const [roles] = await pool.query('SELECT r.name FROM roles r JOIN user_roles ur ON r.id = ur.role_id WHERE ur.user_id = ?', [user.id]);
    const userRoles = roles.map(r => r.name);

    const payload = { username: user.username, id: user.id, roles: userRoles };
    const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });

    res.json({ accessToken });
  } catch (err) {
    console.error('Login error:', err);
    const fallbackUser = findFallbackUser(username);
    if (!fallbackUser) {
      return res.status(401).send('Invalid credentials.');
    }

    const isMatch = await bcrypt.compare(password, fallbackUser.password);
    if (!isMatch) {
      return res.status(401).send('Invalid credentials.');
    }

    const payload = { username: fallbackUser.username, id: fallbackUser.id, roles: fallbackUser.roles || ['User'] };
    const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
    return res.json({ accessToken });
  }
});

app.post('/api/auth/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).send('Username and password are required.');
  }

  if (!isPasswordStrong(password)) {
    return res.status(400).send(passwordPolicyMessage);
  }

  try {
    const [existingUsers] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
    if (existingUsers.length > 0) {
      return res.status(409).send('Username already exists.');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await pool.query('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword]);

    res.status(201).send('User registered successfully.');
  } catch (err) {
    console.error('Registration error:', err);
    const fallbackUser = findFallbackUser(username);
    if (fallbackUser) {
      return res.status(409).send('Username already exists.');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    fallbackUsers.push({ id: fallbackUsers.length + 1, username, password: hashedPassword, roles: ['User'] });
    return res.status(201).send('User registered successfully.');
  }
});

app.post('/api/auth/forgot-password', async (req, res) => {
  const { username } = req.body;
  if (!username) {
    return res.status(400).send('Username is required.');
  }

  try {
    const [users] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
    if (users.length > 0) {
      const user = users[0];
      const token = crypto.randomBytes(32).toString('hex');
      const expiryDate = new Date();
      expiryDate.setHours(expiryDate.getHours() + 1); // Token expires in 1 hour

      await pool.query(
        'INSERT INTO password_reset_tokens (user_id, token, expiry_date) VALUES (?, ?, ?)',
        [user.id, token, expiryDate]
      );

      // In a real application, you would email this link. For now, we log it.
      console.log(`Password reset link for ${username}: http://localhost:3000/reset-password?token=${token}`);
    }
    // Always send a success message to prevent user enumeration attacks.
    res.send('If a user with that username exists, a password reset link has been generated.');
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).send('Server error.');
  }
});

app.post('/api/auth/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) {
    return res.status(400).send('Token and new password are required.');
  }

  if (!isPasswordStrong(newPassword)) {
    return res.status(400).send(passwordPolicyMessage);
  }

  try {
    const [tokens] = await pool.query('SELECT * FROM password_reset_tokens WHERE token = ? AND expiry_date > NOW()', [token]);
    if (tokens.length === 0) {
      return res.status(400).send('Invalid or expired password reset token.');
    }
    const resetToken = tokens[0];

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, resetToken.user_id]);
    await pool.query('DELETE FROM password_reset_tokens WHERE id = ?', [resetToken.id]);

    res.send('Password has been reset successfully.');
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).send('Server error.');
  }
});

// Admin endpoint to trigger a password reset for a specific user
app.post('/api/admin/users/:userId/trigger-password-reset', [authenticateToken, authorizeRoles('Admin')], async (req, res) => {
  const { userId } = req.params;

  try {
    const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
    if (users.length === 0) {
      return res.status(404).send('User not found.');
    }
    const user = users[0];
    const token = crypto.randomBytes(32).toString('hex');
    const expiryDate = new Date();
    expiryDate.setHours(expiryDate.getHours() + 1); // Token expires in 1 hour

    await pool.query(
      'INSERT INTO password_reset_tokens (user_id, token, expiry_date) VALUES (?, ?, ?)',
      [user.id, token, expiryDate]
    );

    const resetLink = `http://localhost:3001/reset-password?token=${token}`;
    // In a real app, you'd email this. For now, we return it to the admin.
    res.send(`Password reset link for ${user.username}: ${resetLink}`);
  } catch (err) {
    console.error(`Error triggering password reset for user ${userId}:`, err);
    res.status(500).send('Server error.');
  }
});

app.post('/api/users/change-password', authenticateToken, async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const userId = req.user.id;

  if (!oldPassword || !newPassword) {
    return res.status(400).send('Old password and new password are required.');
  }

  if (!isPasswordStrong(newPassword)) {
    return res.status(400).send(passwordPolicyMessage);
  }

  try {
    const [users] = await pool.query('SELECT password FROM users WHERE id = ?', [userId]);
    if (users.length === 0) {
      return res.status(404).send('User not found.');
    }
    const user = users[0];

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(401).send('Invalid current password.');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedNewPassword = await bcrypt.hash(newPassword, salt);

    await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashedNewPassword, userId]);
    res.send('Password changed successfully.');
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).send('Server error while changing password.');
  }
});

// --- User Profile Endpoints ---

// Endpoint for a user to get their own details
app.get('/api/users/me', authenticateToken, async (req, res) => {
  try {
    const [users] = await pool.query('SELECT id, username, profile_picture_url FROM users WHERE id = ?', [req.user.id]);
    if (users.length === 0) {
      return res.status(404).send('User not found.');
    }
    const user = users[0];

    const [roles] = await pool.query('SELECT r.name FROM roles r JOIN user_roles ur ON r.id = ur.role_id WHERE ur.user_id = ?', [user.id]);
    user.roles = roles.map(r => r.name);

    res.json(user);
  } catch (err) {
    console.error('Error fetching user profile:', err);
    const fallbackUser = fallbackUsers.find(user => user.id === req.user.id || user.username === req.user.username);
    if (fallbackUser) {
      return res.json({
        id: fallbackUser.id,
        username: fallbackUser.username,
        profile_picture_url: fallbackUser.profile_picture_url || null,
        roles: fallbackUser.roles || ['User'],
      });
    }
    res.status(500).send('Server error.');
  }
});

// Endpoint to upload a profile picture
app.post('/api/users/me/profile-picture', [authenticateToken, upload.single('file')], async (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }

  try {
    const profilePictureUrl = `/uploads/${req.file.filename}`; // URL path to the file
    await pool.query('UPDATE users SET profile_picture_url = ? WHERE id = ?', [profilePictureUrl, req.user.id]);
    res.json({ profilePictureUrl });
  } catch (err) {
    console.error('Error updating profile picture:', err);
    res.status(500).send('Server error while updating profile picture.');
  }
});

// --- Admin Endpoints ---

// Endpoint for admins to get all users
app.get('/api/admin/users', [authenticateToken, authorizeRoles('Admin')], async (req, res) => {
    try {
        const [users] = await pool.query('SELECT id, username FROM users');
        res.json(users);
    } catch (err) {
        console.error('Admin fetch users error:', err);
        res.status(500).send('Server error.');
    }
});

// Endpoint for an admin to delete a user
app.delete('/api/admin/users/:userId', [authenticateToken, authorizeRoles('Admin')], async (req, res) => {
    const { userId } = req.params;
    const adminUserId = req.user.id;

    if (parseInt(userId, 10) === adminUserId) {
        return res.status(400).send('Admins cannot delete their own account.');
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // Delete related records first to satisfy foreign key constraints
        await connection.execute('DELETE FROM user_roles WHERE user_id = ?', [userId]);
        await connection.execute('DELETE FROM password_reset_tokens WHERE user_id = ?', [userId]);
        await connection.execute('DELETE FROM activity_log WHERE user_id = ?', [userId]);

        // Finally, delete the user
        const [result] = await connection.execute('DELETE FROM users WHERE id = ?', [userId]);

        if (result.affectedRows === 0) {
            throw new Error('User not found.');
        }

        await connection.commit();
        res.status(200).send('User deleted successfully.');
    } catch (err) {
        await connection.rollback();
        console.error(`Error deleting user ${userId}:`, err);
        res.status(500).send(err.message || 'Server error while deleting user.');
    } finally {
        connection.release();
    }
});

// Endpoint to get all project health data
app.get('/api/project-health', [authenticateToken, authorizeRoles('Admin', 'Project Manager')], (req, res) => {
  const query = 'SELECT * FROM project_health';
  pool.query(query)
    .then(([results]) => {
      res.json(results);
    })
    .catch(err => {
      console.error('Error fetching project health data:', err);
      res.status(500).send('Error fetching project health data');
    });
});

// Endpoint to get project health data by project ID
app.get('/api/project-health/:id', [authenticateToken, authorizeRoles('Admin', 'Project Manager')], async (req, res) => {
  const projectId = req.params.id;
  // This query now joins with the project table to get the project name.
  const query = `
    SELECT p.name, ph.* 
    FROM project_health ph 
    JOIN project p ON ph.project_id = p.id 
    WHERE ph.project_id = ? 
    ORDER BY ph.timestamp DESC
  `;
  
  try {
    const [results] = await pool.query(query, [projectId]);
    if (results.length === 0) {
      res.status(404).send(`Project with ID ${projectId} not found`);
      return;
    }
    // Return all health records for the project, or just the latest one
    res.json(results); // To return all historical data
  } catch (err) {
    console.error(`Error fetching data for project ID ${projectId}:`, err);
    res.status(500).send('Error fetching project health data');
  }
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
