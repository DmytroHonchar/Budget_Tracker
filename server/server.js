require('dotenv').config({ path: 'C:/Users/dmytr/Documents/Budget_Tracker/public/.env' });
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const { Pool } = require('pg');
const path = require('path');
const url = require('url'); // Make sure to require the 'url' module

const app = express();
const port = process.env.PORT || 3000;
const jwtSecret = process.env.JWT_SECRET;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Middleware to log requests
app.use((req, res, next) => {
    console.log(`Request URL: ${req.url}`);
    next();
});

// Serve static files from the 'public' directory
app.use((req, res, next) => {
    const staticPath = path.join(__dirname, '..', 'public');
    console.log(`Trying to serve static files from: ${staticPath}`);
    express.static(staticPath)(req, res, next);
});

// Serve static files from the 'src' directory
app.use('/src', (req, res, next) => {
    const srcPath = path.join(__dirname, '..', 'src');
    console.log(`Trying to serve static files from: ${srcPath}`);
    express.static(srcPath)(req, res, next);
});

// Serve static files from an alternative path if the above fails
app.use((req, res, next) => {
    const alternativePath = 'C:/Users/dmytr/Documents/Budget_Tracker/public';
    console.log(`Trying to serve static files from: ${alternativePath}`);
    express.static(alternativePath)(req, res, next);
});

app.use('/src', (req, res, next) => {
    const alternativeSrcPath = 'C:/Users/dmytr/Documents/Budget_Tracker/src';
    console.log(`Trying to serve static files from: ${alternativeSrcPath}`);
    express.static(alternativeSrcPath)(req, res, next);
});

// Log environment variables for debugging
console.log("DB_USER:", process.env.DB_USER);
console.log("DB_PASSWORD:", process.env.DB_PASSWORD);
console.log("DB_HOST:", process.env.DB_HOST);
console.log("DB_DATABASE:", process.env.DB_DATABASE);
console.log("DB_PORT:", process.env.DB_PORT);

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// Register endpoint
app.post('/register', async (req, res) => {
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

        res.status(201).json({ userId });
    } catch (error) {
        console.error('Error registering user:', error.message);
        res.status(500).send('Internal Server Error');
    }
});

// Login endpoint
app.post('/login', async (req, res) => {
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

// Middleware to protect routes
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) return res.sendStatus(401); // If there's no token

    jwt.verify(token, jwtSecret, (err, user) => {
        if (err) return res.sendStatus(403); // If token is not valid
        req.user = user;
        next();
    });
};

// Endpoint to get totals
app.get('/totals', authenticateToken, async (req, res) => {
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

// Password reset endpoints
app.post('/request-reset', async (req, res) => {
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
            protocol: 'http',
            hostname: 'localhost',
            port: process.env.PORT || 3000,
            pathname: 'reset-password.html',
            query: { token: token }
        });

        console.log(`Password reset link: ${resetLink}`);

        const mailOptions = {
            to: email,
            from: 'passwordreset@yourapp.com',
            subject: 'Password Reset',
            text: `You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n
            Please click on the following link, or paste this into your browser to complete the process:\n\n
            ${resetLink}\n\n
            If you did not request this, please ignore this email and your password will remain unchanged.\n`,
        };

        transporter.sendMail(mailOptions, (error, response) => {
            if (error) {
                console.error('Error sending email:', error);
                return res.status(500).send('Error sending email');
            }
            console.log('Recovery email sent:', response);
            res.status(200).send('Recovery email sent');
        });
    } catch (error) {
        console.error('Error processing password reset request:', error.message);
        res.status(500).send('Internal Server Error');
    }
});

app.post('/reset-password', async (req, res) => {
    const { token, newPassword } = req.body;
    try {
        const result = await pool.query('SELECT id FROM users WHERE reset_password_token = $1 AND reset_password_expires > $2', [token, Date.now()]);
        if (result.rows.length === 0) {
            console.error('Invalid or expired token:', token);
            return res.status(400).send('Password reset token is invalid or has expired');
        }
        const userId = result.rows[0].id;
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await pool.query('UPDATE users SET password_hash = $1, reset_password_token = NULL, reset_password_expires = NULL WHERE id = $2', [hashedPassword, userId]);
        res.status(200).send('Password has been reset');
    } catch (error) {
        console.error('Error resetting password:', error.message);
        res.status(500).send('Internal Server Error');
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
