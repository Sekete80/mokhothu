const express = require('express');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
    try {
        const { rows: users } = await pool.query(
            'SELECT id, username, name, email, role, created_at FROM users WHERE id = $1',
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ success: true, data: users[0] });

    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

// Get all users (for program leaders only)
router.get('/', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'program_leader') {
            return res.status(403).json({ error: 'Access denied' });
        }

        const { rows: users } = await pool.query(
            'SELECT id, username, name, email, role, created_at FROM users ORDER BY name'
        );

        res.json({ success: true, data: users, count: users.length });

    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

module.exports = router;
