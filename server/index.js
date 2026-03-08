require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
// Using credentials: true is required when dealing with cookies across domains/ports
const allowedOrigins = ['http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174'];
app.use(cors({
    origin: function (origin, callback) {
        // allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            var msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Secrets
const ACCESS_TOKEN_SECRET = 'your_super_secret_access_token';
const REFRESH_TOKEN_SECRET = 'your_super_secret_refresh_token';

// Dummy Database (using let so we can modify it)
let users = [
    { id: 1, email: 'user@example.com', password: 'password123', name: 'Demo User', role: 'End User' }
];

// In-memory refresh token store (in production, use a database or Redis)
let refreshTokens = [];

// Helper functions for tokens
const generateAccessToken = (user) => {
    // Expires in 15 seconds for demonstration purposes
    return jwt.sign({ id: user.id, email: user.email }, ACCESS_TOKEN_SECRET, { expiresIn: '15s' });
};

const generateRefreshToken = (user) => {
    const refreshToken = jwt.sign({ id: user.id, email: user.email }, REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
    refreshTokens.push(refreshToken);
    return refreshToken;
};

// --- ROUTES ---

// 1. Login Endpoint
app.post('/login', (req, res) => {
    const { email, password } = req.body;

    const user = users.find(u => u.email === email && u.password === password);

    if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Send Refresh Token in an HttpOnly cookie
    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // true if using HTTPS
        sameSite: 'lax', // or 'strict' depending on cross-site requirements
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // Send Access Token and basic user info in response body
    res.json({
        message: 'Login successful',
        user: { id: user.id, email: user.email, name: user.name },
        accessToken
    });
});

// 2. Refresh Token Endpoint
app.post('/refresh', (req, res) => {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
        return res.status(401).json({ error: 'No refresh token provided' });
    }

    if (!refreshTokens.includes(refreshToken)) {
        return res.status(403).json({ error: 'Invalid refresh token' });
    }

    jwt.verify(refreshToken, REFRESH_TOKEN_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Refresh token expired or invalid' });
        }

        // Generate a new access token
        // Important: Notice we use the payload from the decrypted refresh token
        const newAccessToken = generateAccessToken({ id: user.id, email: user.email });

        // (Optional but recommended) Rotate the refresh token as well for better security
        // const newRefreshToken = generateRefreshToken({ id: user.id, email: user.email });
        // refreshTokens = refreshTokens.filter(token => token !== refreshToken);
        // res.cookie('refreshToken', newRefreshToken, { httpOnly: true, secure: false, sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 * 1000 });

        res.json({ accessToken: newAccessToken });
    });
});

// 3. Logout Endpoint
app.post('/logout', (req, res) => {
    const refreshToken = req.cookies.refreshToken;

    // Remove from our "database"
    refreshTokens = refreshTokens.filter(token => token !== refreshToken);

    // Clear the cookie
    res.clearCookie('refreshToken');
    res.json({ message: 'Logged out successfully' });
});

// 4. Protected Route Middleware & Endpoint
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // "Bearer TOKEN"

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, ACCESS_TOKEN_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired access token' });
        }
        req.user = user;
        next();
    });
};

app.get('/protected', authenticateToken, (req, res) => {
    res.json({
        message: 'This is protected data!',
        user: req.user,
        secretInfo: 'You found the secret treasure because your access token was valid.'
    });
});

// 5. Update Profile Endpoint
app.put('/api/user/profile', authenticateToken, (req, res) => {
    const { name, email } = req.body;
    const userId = req.user.id; // from authenticateToken middleware

    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) return res.status(404).json({ error: 'User not found' });

    // Update user
    users[userIndex] = { ...users[userIndex], name: name || users[userIndex].name, email: email || users[userIndex].email };

    res.json({ message: 'Profile updated successfully', user: { id: users[userIndex].id, email: users[userIndex].email, name: users[userIndex].name, role: users[userIndex].role } });
});

// 6. Change Password Endpoint
app.put('/api/user/password', authenticateToken, (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) return res.status(404).json({ error: 'User not found' });

    // Verify current password
    if (users[userIndex].password !== currentPassword) {
        return res.status(400).json({ error: 'Incorrect current password' });
    }

    // Update password
    users[userIndex].password = newPassword;

    res.json({ message: 'Password updated successfully' });
});

// Start Server
app.listen(PORT, '127.0.0.1', () => {
    console.log(`Server running on http://127.0.0.1:${PORT}`);
});
