// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const app = express();
const port = process.env.PORT || 3000;
app.use(cors());
app.use(express.json());
// Initialize PostgreSQL Connection Pool
// This relies on the environment variable we will set in Cloudways
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // If the URL contains 'localhost', turn SSL off. Otherwise, turn it on for Cloudways.
  ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }
});
// Initialize the database table on startup
const initDB = async () => {
const createTableQuery = `
CREATE TABLE IF NOT EXISTS tasks (
id SERIAL PRIMARY KEY,
title VARCHAR(255) NOT NULL,
completed BOOLEAN DEFAULT FALSE
);
`;
try {
await pool.query(createTableQuery);
console.log("Database table initialized successfully.");
} catch (err) {
console.error("Error creating table:", err);
}
};
initDB();
// API Route: Get all tasks
app.get('/api/tasks', async (req, res) => {
try {
const result = await pool.query('SELECT * FROM tasks ORDER BY id DESC');
res.json(result.rows);
} catch (err) {
res.status(500).json({ error: 'Failed to fetch tasks' });
}
});
// API Route: Create a new task
app.post('/api/tasks', async (req, res) => {
const { title } = req.body;
if (!title) {
return res.status(400).json({ error: 'Title is required' });
}
try {
const result = await pool.query(
'INSERT INTO tasks (title) VALUES ($1) RETURNING *',
[title]
);
res.status(201).json(result.rows[0]);
} catch (err) {
res.status(500).json({ error: 'Failed to create task' });
}
});
// Start the persistent server
app.listen(port, () => {
console.log(`Express API listening on port ${port}`);
});
