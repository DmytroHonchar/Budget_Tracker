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

app.post('/addAmount', async (req, res) => {
    const { category, amount } = req.body;
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
        const query = `UPDATE totals SET ${column} = ${column} + $1 WHERE id = 1`;
        await pool.query(query, [amount]);
        res.status(200).send('Amount added successfully');
    } catch (error) {
        console.error('Error updating database:', error.message);
        res.status(500).send('Internal Server Error');
    }
});

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
