const express = require('express');
const mysql = require('mysql2');
const cors = require('cors'); // You'll need to install this: npm install cors
const app = express();

// Enable CORS
app.use(cors());

// MySQL connection configuration
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Solo_6969',
    database: 'users'
});

// Connect to MySQL
connection.connect(error => {
    if (error) {
        console.error('Error connecting to the database: ' + error.stack);
        return;
    }
    console.log('Connected to database.');
});

// Create users table if it doesn't exist
connection.query(`
    CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
`, (error) => {
    if (error) throw error;
    console.log('Users table created or already exists');
});

// Middleware to parse JSON bodies
app.use(express.json());
app.use(express.static('public')); // Serve static files from 'public' directory

// Add logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Registration endpoint
app.post('/api/register', (req, res) => {
    console.log('Received registration request:', req.body);
    
    const { username, password } = req.body;

    // Basic validation
    if (!username || !password) {
        console.log('Validation failed: missing username or password');
        return res.status(400).json({ message: 'Username and password are required' });
    }

    // Insert new user
    connection.query(
        'INSERT INTO users (username, password) VALUES (?, ?)',
        [username, password],
        (error, results) => {
            if (error) {
                console.error('Database error:', error);
                // Handle duplicate username
                if (error.code === 'ER_DUP_ENTRY') {
                    return res.status(409).json({ message: 'Username already exists' });
                }
                return res.status(500).json({ message: 'Error creating user' });
            }
            console.log('User registered successfully');
            res.status(201).json({ message: 'User registered successfully' });
        }
    );
});

// Test endpoint
app.get('/test', (req, res) => {
    res.json({ message: 'Server is running correctly' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});