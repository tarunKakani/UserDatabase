const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const app = express();

// Enable CORS
app.use(cors());

// MySQL connection configuration using environment variables
const connection = mysql.createConnection({
    host: process.env.DB_HOST || 'mysql',  // 'mysql' is the service name in docker-compose
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'Solo_6969',
    database: process.env.DB_NAME || 'users',
    port: process.env.DB_PORT || 3306
});

// Connect to MySQL with retry logic
const connectWithRetry = () => {
    connection.connect(error => {
        if (error) {
            console.error('Error connecting to the database:', error);
            console.log('Retrying in 5 seconds...');
            setTimeout(connectWithRetry, 5000);
        } else {
            console.log('Connected to database successfully!');
            initializeDatabase();
        }
    });
};

// Initialize database and tables
function initializeDatabase() {
    // Create users table if it doesn't exist
    connection.query(`
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(255) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `, (error) => {
        if (error) {
            console.error('Error creating table:', error);
        } else {
            console.log('Users table created or already exists');
        }
    });
}

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Registration endpoint
app.post('/api/register', (req, res) => {
    console.log('Received registration request:', req.body);
    
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
    }

    connection.query(
        'INSERT INTO users (username, password) VALUES (?, ?)',
        [username, password],
        (error, results) => {
            if (error) {
                console.error('Database error:', error);
                if (error.code === 'ER_DUP_ENTRY') {
                    return res.status(409).json({ message: 'Username already exists' });
                }
                return res.status(500).json({ message: 'Error creating user' });
            }
            res.status(201).json({ message: 'User registered successfully' });
        }
    );
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
    connectWithRetry();
});