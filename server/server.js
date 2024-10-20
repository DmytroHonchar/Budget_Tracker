// server.js

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

// The necessary modules
const passwordValidator = require('password-validator');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const { Pool } = require('pg');
const csrf = require('csurf');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const app = express();


// Block requests for sensitive files
const blockSensitiveFiles = (req, res, next) => {
    const blockedPaths = [
        '.env', 'wp-config', '.git', 'App_Config', 'jenkinsFile', 'ftp-sync.json',
        'ConnectionStrings.config', 'server.xml', 'api-config.ini', 'laravel.log',
        '.vscode', 'authorized_keys', 'remote-sync.json', 'config.yaml'
    ];

    const fileExtensionPattern = /\.(php|config|xml|json|ini|log|yaml|env)$/i;

    if (blockedPaths.some(path => req.url.includes(path)) || req.url.match(fileExtensionPattern)) {
        return res.status(403).send('Forbidden');
    }
    next();
};

app.use(blockSensitiveFiles); // Add the middleware here to block sensitive file requests

// General rate limiting for all routes
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per window
    message: 'Too many requests, please try again later.'
});

app.use(generalLimiter); // Apply the general rate limiter to all routes

const blockWpPaths = (req, res, next) => {
    const wpPatterns = [
        '/wp-admin', '/wp-config', '/wp-content', '/wp-includes'
    ];
    if (wpPatterns.some(pattern => req.url.includes(pattern))) {
        return res.status(403).send('Forbidden');
    }
    next();
};

app.use(blockWpPaths);


// Use appropriate port for production and local environments
const port = process.env.PORT || 8080;
const jwtSecret = process.env.JWT_SECRET;

// Check for missing environment variables
if (!process.env.DB_USER || !process.env.DB_PASSWORD || !process.env.JWT_SECRET) {
    console.error("Missing necessary environment variables! Please check your .env file.");
    process.exit(1); // Exit the application
}

// 

app.use(helmet());

app.use(helmet.contentSecurityPolicy({
    directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "https:", "'unsafe-inline'"],  // Allow CSS from self and HTTPS
        scriptSrc: ["'self'", "https:", "'unsafe-inline'"],  // Allow scripts from self and HTTPS
        imgSrc: ["'self'", "data:", "https:"],  // Allow images from self, HTTPS, and data URIs
    }
}));
app.use(helmet.frameguard({ action: 'deny' }));  // Prevents clickjacking

app.use(helmet.xssFilter());
app.use(helmet.referrerPolicy({ policy: 'no-referrer' }));
app.use(helmet.hsts({
    maxAge: 31536000,  // 1 year
    includeSubDomains: true,
    preload: true
}));
app.use(helmet.noSniff());
app.use(helmet.frameguard({ action: 'sameorigin' }));

// Cookie Parser
app.use(cookieParser());

// Body parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// CSRF Protection Middleware
const csrfProtection = csrf({ cookie: true });

// Create middleware to set CSRF token cookie
function setCsrfTokenCookie(req, res, next) {
    res.cookie('XSRF-TOKEN', req.csrfToken(), {
        secure: process.env.NODE_ENV === 'production',  // Use secure cookies in production
        sameSite: 'Strict',  // CSRF tokens are only sent to the same site
        httpOnly: false      // Make it accessible by JavaScript
    });
    next();
}

// Determine if SSL should be enabled based on the environment
const sslConfig = process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false;

// Create a new instance of the Pool class
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    ssl: sslConfig,
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
    ? ['https://gopocket.co.uk', 'https://www.gopocket.co.uk']
    : ['http://localhost:8080', 'http://127.0.0.1:8080'];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (such as mobile apps or Postman)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = 'The CORS policy for this site does not allow access from the specified origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    methods: 'GET,POST,PUT,DELETE',
    credentials: true
}));

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

// Initialize rate limiter store
const MemoryStore = rateLimit.MemoryStore;
const loginLimiterStore = new MemoryStore();

// Rate limiter for login
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 login requests per windowMs
    message: 'Too many login attempts, please try again later.',
    store: loginLimiterStore, // Use memory store
    keyGenerator: (req) => req.ip // Track attempts per IP address
});

// Middleware to protect routes
const authenticateToken = (req, res, next) => {
    console.log('authenticateToken middleware called');

    const token = req.cookies.jwt;  // Access token is stored in cookies

    if (!token) return res.sendStatus(401); // No token, unauthorized

    // Verify the JWT token
    jwt.verify(token, jwtSecret, (err, user) => {
        if (err) return res.sendStatus(403); // Invalid token, forbidden
        req.user = user;  // Attach user to the request object
        next();  // Proceed to the next middleware or route handler
    });
};

// Password validation schema
const schema = new passwordValidator();
schema
    .is().min(8)                                    // Minimum length 8 characters
    .is().max(100)                                  // Maximum length 100 characters
    .has().uppercase()                              // Must have at least one uppercase letter
    .has().lowercase()                              // Must have at least one lowercase letter
    .has().digits(1)                                // Must have at least one digit
    .has().not().spaces();                          // Should not contain spaces

// Routes for clean URLs (without .html extensions) to serve specific HTML files
app.get('/', (req, res) => {
    res.sendFile(path.join(staticPath, 'welcome.html'));
});

app.get('/login', csrfProtection, setCsrfTokenCookie, (req, res) => {
    res.sendFile(path.join(staticPath, 'login.html'));
});

app.get('/register', csrfProtection, setCsrfTokenCookie, (req, res) => {
    res.sendFile(path.join(staticPath, 'register.html'));
});

app.get('/income', authenticateToken, csrfProtection, setCsrfTokenCookie, (req, res) => {
    res.sendFile(path.join(staticPath, 'income.html'));
});

app.get('/contact', csrfProtection, setCsrfTokenCookie, (req, res) => {
    res.sendFile(path.join(staticPath, 'contact.html'));
});

app.get('/about', (req, res) => {
    res.sendFile(path.join(staticPath, 'about.html'));
});

app.get('/request-reset', csrfProtection, setCsrfTokenCookie, (req, res) => {
    res.sendFile(path.join(staticPath, 'request-reset.html'));
});

app.get('/reset-password', csrfProtection, setCsrfTokenCookie, (req, res) => {
    res.sendFile(path.join(staticPath, 'reset-password.html'));
});

// Route for guest income page
app.get('/income-guest', (req, res) => {
    res.sendFile(path.join(staticPath, 'income_guest.html'));
});

app.get('/is-authenticated', authenticateToken, (req, res) => {
    res.status(200).json({ authenticated: true });
});



// Registration endpoint
app.post('/register', csrfProtection, async (req, res) => {
    console.log('/register endpoint called');
    const { username, email, password } = req.body;

    // Validate password strength
    if (!schema.validate(password)) {
        return res.status(400).send('Password does not meet security requirements.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const lowerCaseEmail = email.toLowerCase();  // Convert email to lowercase

    try {
        // Insert the new user into the database
        const result = await pool.query(
            'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id',
            [username, lowerCaseEmail, hashedPassword]  // Store the email in lowercase
        );
        const userId = result.rows[0].id;

        // Create initial totals entry for the new user
        await pool.query('INSERT INTO totals (user_id, total_card_pounds, total_card_euro, total_cash_pounds, total_cash_euro) VALUES ($1, 0, 0, 0, 0)', [userId]);

        // Generate a JWT token
        const token = jwt.sign({ userId: userId }, jwtSecret, { expiresIn: '1h' });

        // Generate a refresh token
        const refreshToken = crypto.randomBytes(40).toString('hex');

        // Store refresh token in the database with the user id
        await pool.query('UPDATE users SET refresh_token = $1 WHERE id = $2', [refreshToken, userId]);

        // Set the tokens in HTTP-only cookies
        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 3600000 // 1 hour for access token
        };

        const refreshCookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days for refresh token
        };

        // Send both tokens
        res.cookie('jwt', token, cookieOptions); // Access token
        res.cookie('refreshToken', refreshToken, refreshCookieOptions); // Refresh token

        res.status(201).json({ message: 'Registration successful!' });
    } catch (error) {
        console.error('Error registering user:', error.message);

        // Handle specific errors like duplicate email or username
        if (error.message.includes('users_email_key')) {
            res.status(400).send('A user with this email already exists.');
        } else if (error.message.includes('users_username_key')) {
            res.status(400).send('A user with this username already exists.');
        } else {
            // Catch-all for unexpected errors
            res.status(500).send('Internal Server Error');
        }
    }
});


// Login endpoint
app.post('/login', loginLimiter, csrfProtection, async (req, res) => {
    console.log('/login endpoint called');
    const { email, password } = req.body;
    const lowerCaseEmail = email.toLowerCase();  // Convert email to lowercase

    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [lowerCaseEmail]);  // Query with lowercase email
        const user = result.rows[0];

        if (user && await bcrypt.compare(password, user.password_hash)) {
            const accessToken = jwt.sign({ userId: user.id }, jwtSecret, { expiresIn: '1h' });

            // Generate a refresh token
            const refreshToken = crypto.randomBytes(40).toString('hex');

            // Store refresh token in the database with the user id
            await pool.query('UPDATE users SET refresh_token = $1 WHERE id = $2', [refreshToken, user.id]);

            // Set the tokens in HTTP-only cookies
            const cookieOptions = {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 3600000 // 1 hour for access token
            };

            const refreshCookieOptions = {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days for refresh token
            };

            // Send both tokens
            res.cookie('jwt', accessToken, cookieOptions); // Access token
            res.cookie('refreshToken', refreshToken, refreshCookieOptions); // Refresh token

            res.status(200).json({ message: 'Login successful!' });

        } else {
            res.status(401).json({ error: 'Invalid credentials' });
        }
    } catch (error) {
        console.error('Error logging in:', error); // Log the full error object
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


// Refresh token endpoint
app.post('/refresh-token', async (req, res) => {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
        return res.status(401).send('No refresh token provided');
    }

    try {
        // Fetch user with this refresh token
        const result = await pool.query('SELECT * FROM users WHERE refresh_token = $1', [refreshToken]);
        const user = result.rows[0];

        if (!user) {
            return res.status(403).send('Invalid refresh token');
        }

        // Invalidate the old refresh token
        const newRefreshToken = crypto.randomBytes(40).toString('hex');
        await pool.query('UPDATE users SET refresh_token = $1 WHERE id = $2', [newRefreshToken, user.id]);

        // Generate a new access token
        const newAccessToken = jwt.sign({ userId: user.id }, jwtSecret, { expiresIn: '1h' });

        // Send the new tokens
        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 3600000 // 1 hour expiry
        };

        const refreshCookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days expiry
        };

        res.cookie('jwt', newAccessToken, cookieOptions);
        res.cookie('refreshToken', newRefreshToken, refreshCookieOptions);
        res.status(200).json({ message: 'Access token refreshed!' });

    } catch (error) {
        console.error('Error refreshing token:', error.message);
        res.status(500).send('Internal Server Error');
    }
});

// Logout endpoint
app.post('/logout', async (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    const userIP = req.ip; // Get the user's IP address

    if (!refreshToken) {
        return res.status(400).send('No refresh token found');
    }

    try {
        // Invalidate the refresh token in the database
        await pool.query('UPDATE users SET refresh_token = NULL WHERE refresh_token = $1', [refreshToken]);

        // Reset the rate limiter for this IP
        loginLimiterStore.resetKey(userIP, () => {
            console.log(`Rate limiter reset for IP: ${userIP}`);
        });

        // Clear both access token and refresh token cookies
        res.clearCookie('jwt', { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
        res.clearCookie('refreshToken', { httpOnly: true, secure: process.env.NODE_ENV === 'production' });

        res.status(200).send('Logged out successfully');
    } catch (error) {
        console.error('Error during logout:', error.message);
        res.status(500).send('Internal Server Error');
    }
});

// Endpoint to get totals (no CSRF protection needed)
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
app.post('/updateTotals', authenticateToken, csrfProtection, async (req, res) => {
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
app.post('/deleteTotals', authenticateToken, csrfProtection, async (req, res) => {
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
app.post('/update-email', authenticateToken, csrfProtection, async (req, res) => {
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
app.post('/change-password', authenticateToken, csrfProtection, async (req, res) => {
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
app.post('/delete-account', authenticateToken, csrfProtection, async (req, res) => {
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
app.post('/request-reset', loginLimiter, csrfProtection, async (req, res) => {
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
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
        const expiration = Date.now() + 15 * 60 * 1000; // 15 minutes

        console.log(`Generated token: ${token}, Expiration: ${expiration}`);

        await pool.query(
            'UPDATE users SET reset_password_token = $1, reset_password_expires = $2 WHERE id = $3',
            [hashedToken, expiration, userId]
        );

        // Construct the reset link using req.protocol and req.headers.host
        const resetLink = `${req.protocol}://${req.headers.host}/reset-password?token=${token}`;

        console.log(`Password reset link: ${resetLink}`);

        const mailOptions = {
            to: email,
            from: 'passwordreset@yourapp.com',
            subject: 'Password Reset',
            text: `Hello,

We received a request to reset the password for your Pocket account.

If you initiated this request, please click the link below or copy and paste it into your browser to reset your password:

Reset your password: ${resetLink}

For security reasons, this link will expire in 15 minutes. If you did not request a password reset, no action is needed. You can safely ignore this email, and your password will remain unchanged.

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

// Password reset endpoint
app.post('/reset-password', csrfProtection, async (req, res) => {
    console.log('/reset-password endpoint called');
    const { token, newPassword } = req.body;

    try {
        // Hash the received token to match it with the hashed token in the database
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        // Find the user with the matching hashed token
        const result = await pool.query('SELECT id, reset_password_expires FROM users WHERE reset_password_token = $1', [hashedToken]);

        // If no user found or token expired
        if (result.rows.length === 0) {
            console.error('Invalid or expired password reset token');
            return res.status(400).send('Invalid or expired password reset token');
        }

        const user = result.rows[0];
        if (Date.now() > user.reset_password_expires) {
            console.error('Password reset token has expired');
            return res.status(400).send('Password reset token has expired');
        }

        // Validate new password strength
        if (!schema.validate(newPassword)) {
            return res.status(400).send('Password does not meet security requirements.');
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update user's password and remove the reset token and expiry
        await pool.query('UPDATE users SET password_hash = $1, reset_password_token = NULL, reset_password_expires = NULL WHERE id = $2', [hashedPassword, user.id]);

        res.status(200).send('Password has been reset');
    } catch (error) {
        console.error('Error resetting password:', error.message);
        res.status(500).send('Internal Server Error');
    }
});

// Contact form endpoint
app.post('/contact', csrfProtection, async (req, res) => {
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
