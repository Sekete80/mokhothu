const jwt = require('jsonwebtoken');
const pool = require('../config/database');

const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'Access token required' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Verify user still exists in database
        const result = await pool.query(
            'SELECT id, username, name, email, role FROM users WHERE id = $1',
            [decoded.id]
        );

        if (result.rows.length === 0) {
            return res.status(403).json({ error: 'User no longer exists' });
        }

        req.user = result.rows[0];
        next();
    } catch (error) {
        return res.status(403).json({ error: 'Invalid or expired token' });
    }
};

module.exports = { authenticateToken };
