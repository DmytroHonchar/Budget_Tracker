const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const app = express();
const port = 3000;
const jwtSecret = '3AVmFaW67d3bK9vD9pj0aIb3KbD/2jp0b7svBErXlF8J7TvRv1u/mwTgT2tnqD2Z4iOH8Bvv1oI3lKv7CJ8zZg==';

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'budget_tracker',
    password: 'jordan236',
    port: 5432,
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

// Endpoint to add an amount
app.post('/addAmount', authenticateToken, async (req, res) => {
    const { category, amount } = req.body;
    const userId = req.user.userId;

    try {
        let column;
        switch (category) {
            case 'card£':
                column = 'total_card_pounds';
                break;
            case 'card€':
                column = 'total_card_euro';
                break;
            case 'cash£':
                column = 'total_cash_pounds';
                break;
            case 'cash€':
                column = 'total_cash_euro';
                break;
            default:
                return res.status(400).send('Invalid category');
        }
        const updateQuery = `UPDATE totals SET ${column} = ${column} + $1 WHERE user_id = $2`;
        await pool.query(updateQuery, [amount, userId]);

        res.status(200).send('Amount added successfully');
    } catch (error) {
        console.error('Error adding amount:', error.message);
        res.status(500).send('Internal Server Error');
    }
});

// Endpoint to update an amount
app.post('/updateAmount', authenticateToken, async (req, res) => {
    const { category, oldAmount, newAmount } = req.body;
    const userId = req.user.userId;
    let column;

    switch (category) {
        case 'card£':
            column = 'total_card_pounds';
            break;
        case 'card€':
            column = 'total_card_euro';
            break;
        case 'cash£':
            column = 'total_cash_pounds';
            break;
        case 'cash€':
            column = 'total_cash_euro';
            break;
        default:
            return res.status(400).send('Invalid category');
    }

    try {
        const updateQuery = `UPDATE totals SET ${column} = ${column} - $1 + $2 WHERE user_id = $3`;
        await pool.query(updateQuery, [oldAmount, newAmount, userId]);
        res.status(200).send('Amount updated successfully');
    } catch (error) {
        console.error('Error updating database:', error.message);
        res.status(500).send('Internal Server Error');
    }
});

// Endpoint to delete an amount
app.post('/deleteAmount', authenticateToken, async (req, res) => {
    const { category, amount } = req.body;
    const userId = req.user.userId;
    let column;

    switch (category) {
        case 'card£':
            column = 'total_card_pounds';
            break;
        case 'card€':
            column = 'total_card_euro';
            break;
        case 'cash£':
            column = 'total_cash_pounds';
            break;
        case 'cash€':
            column = 'total_cash_euro';
            break;
        default:
            return res.status(400).send('Invalid category');
    }

    try {
        const updateQuery = `UPDATE totals SET ${column} = ${column} - $1 WHERE user_id = $2`;
        await pool.query(updateQuery, [amount, userId]);
        res.status(200).send('Amount deleted successfully and total updated');
    } catch (error) {
        console.error('Error updating database:', error.message);
        res.status(500).send('Internal Server Error');
    }
});

// Endpoint to delete total amount for a category
app.post('/deleteTotalAmount', authenticateToken, async (req, res) => {
    const { category } = req.body;
    const userId = req.user.userId;
    let column;

    switch (category) {
        case 'card£':
            column = 'total_card_pounds';
            break;
        case 'card€':
            column = 'total_card_euro';
            break;
        case 'cash£':
            column = 'total_cash_pounds';
            break;
        case 'cash€':
            column = 'total_cash_euro';
            break;
        default:
            return res.status(400).send('Invalid category');
    }

    try {
        // Update the totals table to set the category total to zero
        const query = `UPDATE totals SET ${column} = 0 WHERE user_id = $1`;
        await pool.query(query, [userId]);
        res.status(200).send('Total amount deleted successfully');
    } catch (error) {
        console.error('Error updating database:', error.message);
        res.status(500).send('Internal Server Error');
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
