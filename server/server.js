const path = require('path');
const fs = require('fs');

// Function to load .env file from a given path
function loadEnvFile(envFilePath) {
    if (fs.existsSync(envFilePath)) {
        require('dotenv').config({ path: envFilePath });
        console.log(`Loaded .env file from ${envFilePath}`);
    } else {
        console.error(`.env file not found at ${envFilePath}`);
    }
}

// Log the current NODE_ENV
console.log("Current NODE_ENV:", process.env.NODE_ENV);

// Check for production environment explicitly
if (process.env.NODE_ENV === 'production') {
    console.log("Running in production mode");
    const envFilePath = path.resolve('/home/ubuntu/Budget_Tracker/.env');
    loadEnvFile(envFilePath);
} else {
    console.log("Running in development mode");
    const envFilePath = path.resolve('C:/Users/dmytr/Documents/Budget_Tracker/server/.env');
    loadEnvFile(envFilePath);
}

// Now, require the necessary modules
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const { Pool } = require('pg');
const url = require('url');
const app = express();

// Use appropriate port for production and local environments
const port = process.env.PORT || 8080;
const jwtSecret = process.env.JWT_SECRET;

// Check for missing environment variables
if (!process.env.DB_USER || !process.env.DB_PASSWORD || !process.env.JWT_SECRET) {
    console.error("Missing necessary environment variables! Please check your .env file.");
    process.exit(1); // Exit the application
}

// Log environment variables for debugging (only in development)
if (process.env.NODE_ENV !== 'production') {
    console.log("DB_USER:", process.env.DB_USER);
    console.log("DB_PASSWORD:", process.env.DB_PASSWORD);
    console.log("DB_HOST:", process.env.DB_HOST);
    console.log("DB_DATABASE:", process.env.DB_DATABASE);
    console.log("DB_PORT:", process.env.DB_PORT);
    console.log("EMAIL_USER:", process.env.EMAIL_USER);
    console.log("EMAIL_PASS:", process.env.EMAIL_PASS);
}

// Create a new instance of the Pool class
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// Create a nodemailer transporter
const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// CORS Configuration: Allow requests from your EC2 frontend
const allowedOrigins = process.env.NODE_ENV === 'production'
    ? ['http://your-production-domain.com']
    : ['http://localhost:8080', 'http://127.0.0.1:8080'];

app.use(cors({
    origin: allowedOrigins,
    methods: 'GET,POST,PUT,DELETE',
    credentials: true
}));

// Middleware setup
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from 'public' and 'src' directories
const staticPath = path.resolve(__dirname, '..', 'public');
const srcPath = path.resolve(__dirname, '..', 'src');

console.log('Static Path:', staticPath);
console.log('Src Path:', srcPath);

app.use(express.static(staticPath));
app.use('/src', express.static(srcPath));

// Middleware to log requests
app.use((req, res, next) => {
    console.log(`Request URL: ${req.url}`);
    next();
});

// Middleware to protect routes
const authenticateToken = (req, res, next) => {
    console.log('authenticateToken middleware called');
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) return res.sendStatus(401); // If there's no token

    jwt.verify(token, jwtSecret, (err, user) => {
        if (err) return res.sendStatus(403); // If token is not valid
        req.user = user;
        next();
    });
};

// Register endpoint
app.post('/register', async (req, res) => {
    console.log('/register endpoint called');
    const { username, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        const result = await pool.query(
            'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id',
            [username, email, hashedPassword]
        );
        const userId = result.rows[0].id;

        // Create initial totals entry for the new user
        await pool.query('INSERT INTO totals (user_id, total_card_pounds, total_card_euro, total_cash_pounds, total_cash_euro) VALUES ($1, 0, 0, 0, 0)', [userId]);

        const token = jwt.sign({ userId: userId }, jwtSecret, { expiresIn: '1h' });

        res.status(201).json({ token });
    } catch (error) {
        console.error('Error registering user:', error.message);

        if (error.message.includes('users_email_key')) {
            res.status(400).send('A user with this email already exists.');
        } else if (error.message.includes('users_username_key')) {
            res.status(400).send('A user with this username already exists.');
        } else {
            res.status(500).send('Internal Server Error');
        }
    }
});

// Login endpoint
app.post('/login', async (req, res) => {
    console.log('/login endpoint called');
    const { email, password } = req.body;

    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = result.rows[0];

        if (user && await bcrypt.compare(password, user.password_hash)) {
            const token = jwt.sign({ userId: user.id }, jwtSecret, { expiresIn: '1h' });
            res.json({ token });
        } else {
            res.status(401).send('Invalid credentials');
        }
    } catch (error) {
        console.error('Error logging in:', error.message);
        res.status(500).send('Internal Server Error');
    }
});

// Endpoint to get totals
app.get('/totals', authenticateToken, async (req, res) => {
    console.log('/totals endpoint called');
    try {
        const result = await pool.query('SELECT total_card_pounds, total_card_euro, total_cash_pounds, total_cash_euro FROM totals WHERE user_id = $1', [req.user.userId]);
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching totals:', error.message);
        res.status(500).send('Internal Server Error');
    }
});

// Endpoint to update the totals
app.post('/updateTotals', authenticateToken, async (req, res) => {
    console.log('/updateTotals endpoint called');
    const { totalCardPounds, totalCardEuro, totalCashPounds, totalCashEuro } = req.body;
    const userId = req.user.userId;

    try {
        await pool.query(
            'UPDATE totals SET total_card_pounds = $1, total_card_euro = $2, total_cash_pounds = $3, total_cash_euro = $4 WHERE user_id = $5',
            [totalCardPounds, totalCardEuro, totalCashPounds, totalCashEuro, userId]
        );
        res.status(200).send('Totals updated successfully');
    } catch (error) {
        console.error('Error updating totals:', error.message);
        res.status(500).send('Internal Server Error');
    }
});

// Endpoint to delete the totals
app.post('/deleteTotals', authenticateToken, async (req, res) => {
    console.log('/deleteTotals endpoint called');
    const userId = req.user.userId;

    try {
        await pool.query(
            'UPDATE totals SET total_card_pounds = 0, total_card_euro = 0, total_cash_pounds = 0, total_cash_euro = 0 WHERE user_id = $1',
            [userId]
        );
        res.status(200).send('Totals deleted successfully');
    } catch (error) {
        console.error('Error deleting totals:', error.message);
        res.status(500).send('Internal Server Error');
    }
});

// Update email endpoint
app.post('/update-email', authenticateToken, async (req, res) => {
    const { newEmail } = req.body;
    const userId = req.user.userId;
    try {
        await pool.query('UPDATE users SET email = $1 WHERE id = $2', [newEmail, userId]);
        res.status(200).send('Email updated successfully');
    } catch (error) {
        console.error('Error updating email:', error.message);
        res.status(500).send('Internal Server Error');
    }
});

// Change password endpoint
app.post('/change-password', authenticateToken, async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.userId;
    try {
        const result = await pool.query('SELECT password_hash FROM users WHERE id = $1', [userId]);
        const user = result.rows[0];
        if (user && await bcrypt.compare(currentPassword, user.password_hash)) {
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hashedPassword, userId]);
            res.status(200).send('Password changed successfully');
        } else {
            res.status(400).send('Current password is incorrect');
        }
    } catch (error) {
        console.error('Error changing password:', error.message);
        res.status(500).send('Internal Server Error');
    }
});

// Delete account endpoint
app.post('/delete-account', authenticateToken, async (req, res) => {
    const userId = req.user.userId;
    console.log(`Attempting to delete account with user ID: ${userId}`);
    try {
        // Begin transaction
        await pool.query('BEGIN');

        // Check if user exists
        const userCheck = await pool.query('SELECT id FROM users WHERE id = $1', [userId]);
        if (userCheck.rowCount === 0) {
            console.error(`User with ID ${userId} not found.`);
            await pool.query('ROLLBACK');
            return res.status(404).send('User not found');
        }

        // Delete related entries in the totals table
        await pool.query('DELETE FROM totals WHERE user_id = $1', [userId]);

        // Delete user
        await pool.query('DELETE FROM users WHERE id = $1', [userId]);

        // Commit transaction
        await pool.query('COMMIT');
        console.log(`Account with user ID ${userId} deleted successfully.`);
        res.status(200).send('Account deleted successfully');
    } catch (error) {
        // Rollback transaction in case of error
        await pool.query('ROLLBACK');
        console.error('Error deleting account:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Password reset endpoints
app.post('/request-reset', async (req, res) => {
    console.log('/request-reset endpoint called');
    const { email } = req.body;
    try {
        const result = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            console.error('User not found for email:', email);
            return res.status(404).send('User not found');
        }

        const userId = result.rows[0].id;
        const token = crypto.randomBytes(20).toString('hex');
        const expiration = Date.now() + 3600000; // 1 hour from now

        console.log(`Generated token: ${token}, Expiration: ${expiration}`);

        await pool.query('UPDATE users SET reset_password_token = $1, reset_password_expires = $2 WHERE id = $3', [token, expiration, userId]);

        const resetLink = url.format({
            protocol: 'http',  // Use 'https' if you're using SSL in production
            hostname: apiUrl.replace(/^http:\/\/|https:\/\//, ''),  // Remove protocol for hostname
            port: process.env.NODE_ENV === 'development' ? (process.env.PORT || 8080) : '',  // Include port in development, exclude in production
            pathname: 'reset-password.html',
            query: { token: token }
        });

        console.log(`Password reset link: ${resetLink}`);

        const mailOptions = {
            to: email,
            from: 'passwordreset@yourapp.com',
            subject: 'Password Reset',
            text: `Hello,

We received a request to reset the password for your Pocket account.

If you initiated this request, please click the link below or copy and paste it into your browser to reset your password:

Reset your password: ${resetLink}
For security reasons, this link will expire in 1 hour. If you did not request a password reset, no action is needed. You can safely ignore this email, and your password will remain unchanged.

Thank you for using Pocket!

Best regards,
The Pocket Team`
        };

        await transporter.sendMail(mailOptions);
        res.status(200).send('Password reset email sent');
    } catch (error) {
        console.error('Error requesting password reset:', error.message);
        res.status(500).send('Internal Server Error');
    }
});

app.post('/reset-password', async (req, res) => {
    console.log('/reset-password endpoint called');
    const { token, newPassword } = req.body;
    try {
        const result = await pool.query('SELECT id, reset_password_expires FROM users WHERE reset_password_token = $1', [token]);
        if (result.rows.length === 0) {
            console.error('Invalid or expired password reset token');
            return res.status(400).send('Invalid or expired password reset token');
        }

        const user = result.rows[0];
        if (Date.now() > user.reset_password_expires) {
            console.error('Password reset token has expired');
            return res.status(400).send('Password reset token has expired');
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await pool.query('UPDATE users SET password_hash = $1, reset_password_token = NULL, reset_password_expires = NULL WHERE id = $2', [hashedPassword, user.id]);

        res.status(200).send('Password has been reset');
    } catch (error) {
        console.error('Error resetting password:', error.message);
        res.status(500).send('Internal Server Error');
    }
});

// Contact form endpoint
app.post('/contact', async (req, res) => {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
        return res.status(400).send('All fields are required');
    }

    const mailOptions = {
        from: email, // User's email address
        to: process.env.EMAIL_USER, // Your fixed receiver email address
        subject: 'New Contact Form Submission',
        text: `You have a new message from ${name} (${email}):\n\n${message}`
    };

    try {
        await transporter.sendMail(mailOptions);
        res.status(200).send('Message sent successfully');
    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

