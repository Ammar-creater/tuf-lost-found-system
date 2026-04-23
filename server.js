const express = require('express');
const path = require('path');
const mysql = require('mysql2');
const dotenv = require('dotenv');
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Debug: Check environment variables
console.log('=== Environment Variables ===');
console.log('MYSQLHOST:', process.env.MYSQLHOST);
console.log('MYSQLUSER:', process.env.MYSQLUSER);
console.log('MYSQLPASSWORD:', process.env.MYSQLPASSWORD ? '***SET***' : 'NOT SET');
console.log('MYSQLDATABASE:', process.env.MYSQLDATABASE);
console.log('=============================');

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// CORS
// CORS - Allow frontend from Vercel
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});


// Database connection for Railway (internal)
// Database connection - works both locally and on Railway
const db = mysql.createPool({
    host: process.env.MYSQLHOST || process.env.DB_HOST || 'localhost',
    user: process.env.MYSQLUSER || process.env.DB_USER || 'root',
    password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || '',
    database: process.env.MYSQLDATABASE || process.env.DB_NAME || 'tuf_lost_found_db',
    port: parseInt(process.env.MYSQLPORT || process.env.DB_PORT || '3306'),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test connection
db.getConnection((err, connection) => {
    if (err) {
        console.error('❌ Database connection failed:', err.message);
    } else {
        console.log('✅ Database connected successfully!');
        connection.release();
    }
});


// ============ STATIC PAGE ROUTES ============
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/index.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/login.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/admin.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/css/style.css', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'css', 'style.css'));
});

// ============ API ROUTES ============

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Test route
app.get('/api/test', (req, res) => {
    res.json({ success: true, message: 'API is working!' });
});

// Get statistics
app.get('/api/stats', (req, res) => {
    const query = `SELECT 
        COUNT(CASE WHEN type = 'lost' THEN 1 END) as lost_count,
        COUNT(CASE WHEN type = 'found' THEN 1 END) as found_count,
        COUNT(*) as total_count
        FROM items`;
    
    db.query(query, (err, result) => {
        if (err) {
            console.error('Stats error:', err);
            return res.json({ success: true, data: { lost_count: 0, found_count: 0, total_count: 0 } });
        }
        res.json({ success: true, data: result[0] });
    });
});

// Get lost items
app.get('/api/items/lost', (req, res) => {
    const query = 'SELECT id, type, name, category, created_at FROM items WHERE type = "lost" ORDER BY created_at DESC';
    db.query(query, (err, results) => {
        if (err) {
            return res.json({ success: true, data: [] });
        }
        res.json({ success: true, data: results });
    });
});

// Get found items
app.get('/api/items/found', (req, res) => {
    const query = 'SELECT id, type, name, category, created_at FROM items WHERE type = "found" ORDER BY created_at DESC';
    db.query(query, (err, results) => {
        if (err) {
            return res.json({ success: true, data: [] });
        }
        res.json({ success: true, data: results });
    });
});

// Get single item
app.get('/api/items/:id', (req, res) => {
    const query = 'SELECT * FROM items WHERE id = ?';
    db.query(query, [req.params.id], (err, results) => {
        if (err || results.length === 0) {
            return res.status(404).json({ success: false, message: 'Item not found' });
        }
        res.json({ success: true, data: results[0] });
    });
});

// Search items
app.get('/api/search', (req, res) => {
    const keyword = req.query.q;
    const query = 'SELECT id, type, name, category, created_at FROM items WHERE name LIKE ? OR category LIKE ? ORDER BY created_at DESC';
    db.query(query, [`%${keyword}%`, `%${keyword}%`], (err, results) => {
        if (err) {
            return res.json({ success: true, data: [] });
        }
        res.json({ success: true, data: results });
    });
});

// Report lost item
app.post('/api/report/lost', (req, res) => {
    const { name, category, cnic, contact, location, description } = req.body;
    
    const query = 'INSERT INTO items (type, name, category, cnic, contact, location, description) VALUES (?, ?, ?, ?, ?, ?, ?)';
    db.query(query, ['lost', name, category, cnic, contact, location, description], (err, result) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Database error' });
        }
        res.json({ success: true, message: 'Lost item reported successfully', id: result.insertId });
    });
});

// Report found item
app.post('/api/report/found', (req, res) => {
    const { name, category, cnic, contact, location, description } = req.body;
    
    const query = 'INSERT INTO items (type, name, category, cnic, contact, location, description) VALUES (?, ?, ?, ?, ?, ?, ?)';
    db.query(query, ['found', name, category, cnic, contact, location, description], (err, result) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Database error' });
        }
        res.json({ success: true, message: 'Found item reported successfully', id: result.insertId });
    });
});

// Admin login
app.post('/auth/login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'tuf_admin' && password === 'TUFAdmin@2025') {
        res.json({ success: true, message: 'Login successful' });
    } else {
        res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
});

// Debug endpoint
app.get('/debug', (req, res) => {
    const fs = require('fs');
    try {
        const files = fs.readdirSync('.');
        const publicExists = fs.existsSync('./public');
        const indexExists = fs.existsSync('./public/index.html');
        res.json({
            success: true,
            publicExists: publicExists,
            indexExists: indexExists,
            files: files,
            currentDirectory: __dirname
        });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

// Simple test route
app.get('/test', (req, res) => {
    res.send('Railway server is working!');
});

// Catch-all for 404
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`
========================================
🎓 TUF University Lost & Found System
========================================
🚀 Server running on: http://localhost:${PORT}
📱 Public Portal: http://localhost:${PORT}
🔐 Admin Login: http://localhost:${PORT}/login.html
💚 Health Check: http://localhost:${PORT}/health
========================================
    `);
});