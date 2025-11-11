// backend/routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');

const router = express.Router();

// ==========================
// 🔹 User Registration
// ==========================
router.post('/register', async (req, res) => {
    try {
        const { username, password, name, email, role } = req.body;

        if (!username || !password || !name || !email || !role) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Check if user already exists
        const { rows: existingUsers } = await pool.query(
            'SELECT id FROM users WHERE username = $1 OR email = $2',
            [username, email]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({ error: 'Username or email already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert new user and get ID
        const { rows } = await pool.query(
            'INSERT INTO users (username, password, name, email, role) VALUES ($1, $2, $3, $4, $5) RETURNING id',
            [username, hashedPassword, name, email, role]
        );

        const userId = rows[0].id;

        // Generate JWT token
        const token = jwt.sign(
            { id: userId, username, role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: { id: userId, username, name, email, role }
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error during registration' });
    }
});

// ==========================
// 🔹 User Login
// ==========================
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        // Find user
        const { rows: users } = await pool.query(
            'SELECT * FROM users WHERE username = $1',
            [username]
        );

        if (users.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = users[0];

        // Verify password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                username: user.username,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error during login' });
    }
});

module.exports = router;
