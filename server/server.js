const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors'); // Require the cors package
const { Pool } = require('pg');
const app = express();
const port = 3000;

// Use the cors middleware
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

// Endpoint to add an amount
app.post('/addAmount', async (req, res) => {
    const { category, amount } = req.body;
    try {
        const query = `INSERT INTO income (category, amount) VALUES ($1, $2) RETURNING *`;
        const values = [category, amount];
        const result = await pool.query(query, values);

        // Update totals
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
        const updateQuery = `UPDATE totals SET ${column} = ${column} + $1 WHERE id = 1`;
        await pool.query(updateQuery, [amount]);

        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Error adding amount:', error.message);
        res.status(500).send('Internal Server Error');
    }
});

// Endpoint to delete total amount for a category
app.post('/deleteTotalAmount', async (req, res) => {
    const { category } = req.body;
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
        const query = `UPDATE totals SET ${column} = 0 WHERE id = 1`;
        await pool.query(query);
        res.status(200).send('Total amount deleted successfully');
    } catch (error) {
        console.error('Error updating database:', error.message);
        res.status(500).send('Internal Server Error');
    }
});

// Endpoint to get totals
app.get('/totals', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM totals WHERE id = 1');
        console.log('Result from database:', result.rows[0]); // Log the result
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching data:', error.message);
        res.status(500).send('Internal Server Error');
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

app.post('/updateAmount', async (req, res) => {
    const { category, oldAmount, newAmount } = req.body;
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
        const updateQuery = `UPDATE totals SET ${column} = ${column} - $1 + $2 WHERE id = 1`;
        await pool.query(updateQuery, [oldAmount, newAmount]);
        res.status(200).send('Amount updated successfully');
    } catch (error) {
        console.error('Error updating database:', error.message);
        res.status(500).send('Internal Server Error');
    }
});
