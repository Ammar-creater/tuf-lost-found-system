const express = require('express');
const path = require('path');
const mysql = require('mysql2');
const app = express();
const PORT = process.env.PORT || 3000;
const dotenv = require('dotenv');
dotenv.config();



// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Enable CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// Database connection with SSL support for production
// Database connection - works on Railway, Local, and Aiven
const db = mysql.createConnection({
    host: process.env.MYSQL_HOST || process.env.DB_HOST || 'localhost',
    user: process.env.MYSQL_USER || process.env.DB_USER || 'root',
    password: process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || process.env.DB_NAME || 'tuf_lost_found_db',
    port: parseInt(process.env.MYSQL_PORT || process.env.DB_PORT || '3306'),
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});

// Connect to database
db.connect((err) => {
    if (err) {
        console.error('❌ Database connection failed:', err.message);
        console.log('\n💡 Please check:');
        console.log('1. MySQL is running in XAMPP');
        console.log('2. Database "tuf_lost_found_db" exists');
    } else {
        console.log('✅ Database connected successfully!');
    }
});

// ============ PUBLIC API ROUTES (Location Hidden) ============

// Test route
app.get('/api/test', (req, res) => {
    res.json({ success: true, message: 'API is working!' });
});

// Get statistics
app.get('/api/stats', (req, res) => {
    const query = `SELECT 
        COUNT(CASE WHEN type = 'lost' THEN 1 END) as lost_count,
        COUNT(CASE WHEN type = 'found' THEN 1 END) as found_count,
        COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved_count,
        COUNT(CASE WHEN status = 'open' OR status = 'pending' THEN 1 END) as pending_count,
        COUNT(CASE WHEN DATE(created_at) = CURDATE() THEN 1 END) as today_count,
        COUNT(*) as total_count
        FROM items`;
    
    db.query(query, (err, result) => {
        if (err) {
            console.error('Stats error:', err);
            return res.json({ success: true, data: { lost_count: 0, found_count: 0, resolved_count: 0, pending_count: 0, today_count: 0, total_count: 0 } });
        }
        res.json({ success: true, data: result[0] });
    });
});

// Get lost items (public - no location)
app.get('/api/items/lost', (req, res) => {
    const query = 'SELECT id, type, name, category, cnic, contact, created_at, status FROM items WHERE type = "lost" ORDER BY created_at DESC';
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching lost items:', err);
            return res.json({ success: true, data: [] });
        }
        // Mask CNIC for public
        const maskedResults = results.map(item => ({
            ...item,
            cnic: maskCNIC(item.cnic)
        }));
        res.json({ success: true, data: maskedResults });
    });
});

// Get found items (public - no location)
app.get('/api/items/found', (req, res) => {
    const query = 'SELECT id, type, name, category, cnic, contact, created_at, status FROM items WHERE type = "found" ORDER BY created_at DESC';
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching found items:', err);
            return res.json({ success: true, data: [] });
        }
        // Mask CNIC for public
        const maskedResults = results.map(item => ({
            ...item,
            cnic: maskCNIC(item.cnic)
        }));
        res.json({ success: true, data: maskedResults });
    });
});

// Get single item (includes location for admin, but public gets masked)
app.get('/api/items/:id', (req, res) => {
    const query = 'SELECT * FROM items WHERE id = ?';
    db.query(query, [req.params.id], (err, results) => {
        if (err || results.length === 0) {
            return res.status(404).json({ success: false, message: 'Item not found' });
        }
        const item = results[0];
        // Mask CNIC for public, but keep location (will be shown after login)
        item.cnic = maskCNIC(item.cnic);
        // Don't delete location - it will be shown in admin panel
        res.json({ success: true, data: item });
    });
});

// Search items (public)
app.get('/api/search', (req, res) => {
    const keyword = req.query.q;
    const type = req.query.type;
    
    let query = 'SELECT id, type, name, category, cnic, contact, created_at, status FROM items WHERE (name LIKE ? OR category LIKE ? OR description LIKE ?)';
    let params = [`%${keyword}%`, `%${keyword}%`, `%${keyword}%`];
    
    if (type && type !== 'all') {
        query += ' AND type = ?';
        params.push(type);
    }
    
    query += ' ORDER BY created_at DESC';
    
    db.query(query, params, (err, results) => {
        if (err) {
            return res.json({ success: true, data: [] });
        }
        // Mask CNIC for public
        const maskedResults = results.map(item => ({
            ...item,
            cnic: maskCNIC(item.cnic)
        }));
        res.json({ success: true, data: maskedResults });
    });
});

// Report lost item
app.post('/api/report/lost', (req, res) => {
    const { name, category, cnic, contact, location, description } = req.body;
    
    const cnicRegex = /^[0-9]{5}-[0-9]{7}-[0-9]{1}$/;
    if (!cnicRegex.test(cnic)) {
        return res.status(400).json({ success: false, message: 'Invalid CNIC format. Use: 12345-1234567-1' });
    }
    
    const query = 'INSERT INTO items (type, name, category, cnic, contact, location, description, status) VALUES (?, ?, ?, ?, ?, ?, ?, "open")';
    db.query(query, ['lost', name, category, cnic, contact, location, description], (err, result) => {
        if (err) {
            console.error('Error:', err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }
        res.json({ success: true, message: 'Lost item reported successfully', id: result.insertId });
    });
});

// Report found item
app.post('/api/report/found', (req, res) => {
    const { name, category, cnic, contact, location, description } = req.body;
    
    const cnicRegex = /^[0-9]{5}-[0-9]{7}-[0-9]{1}$/;
    if (!cnicRegex.test(cnic)) {
        return res.status(400).json({ success: false, message: 'Invalid CNIC format. Use: 12345-1234567-1' });
    }
    
    const query = 'INSERT INTO items (type, name, category, cnic, contact, location, description, status) VALUES (?, ?, ?, ?, ?, ?, ?, "open")';
    db.query(query, ['found', name, category, cnic, contact, location, description], (err, result) => {
        if (err) {
            console.error('Error:', err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }
        res.json({ success: true, message: 'Found item reported successfully', id: result.insertId });
    });
});

// ============ ADMIN API ROUTES (Full Access) ============

// Get all items (admin - full details)
app.get('/api/items/all', (req, res) => {
    const query = 'SELECT * FROM items ORDER BY created_at DESC';
    db.query(query, (err, results) => {
        if (err) {
            return res.json({ success: true, data: [] });
        }
        res.json({ success: true, data: results });
    });
});

// Get pending items (admin)
app.get('/api/items/pending', (req, res) => {
    const query = 'SELECT * FROM items WHERE status = "open" OR status = "pending" ORDER BY created_at DESC';
    db.query(query, (err, results) => {
        if (err) {
            return res.json({ success: true, data: [] });
        }
        res.json({ success: true, data: results });
    });
});

// Get resolved items (admin)
app.get('/api/items/resolved', (req, res) => {
    const query = 'SELECT * FROM items WHERE status = "resolved" ORDER BY created_at DESC';
    db.query(query, (err, results) => {
        if (err) {
            return res.json({ success: true, data: [] });
        }
        res.json({ success: true, data: results });
    });
});

// Resolve item (admin)
app.put('/api/items/:id/resolve', (req, res) => {
    const query = 'UPDATE items SET status = "resolved" WHERE id = ?';
    db.query(query, [req.params.id], (err, result) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Database error' });
        }
        res.json({ success: true, message: 'Item resolved successfully' });
    });
});

// Delete item (admin)
app.delete('/api/items/:id', (req, res) => {
    const query = 'DELETE FROM items WHERE id = ?';
    db.query(query, [req.params.id], (err, result) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Database error' });
        }
        res.json({ success: true, message: 'Item deleted successfully' });
    });
});

// Admin login
app.post('/auth/login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'tuf_admin' && password === 'TUFAdmin@2025') {
        res.json({ success: true, message: 'Login successful', role: 'admin' });
    } else {
        res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString(), service: 'TUF Lost & Found' });
});

// Helper function to mask CNIC
function maskCNIC(cnic) {
    if (!cnic) return 'XXXXX-XXXXXXX-X';
    const parts = cnic.split('-');
    if (parts.length === 3) {
        return `XXXXX-XXXXXXX-${parts[2]}`;
    }
    return 'XXXXX-XXXXXXX-X';
}
// Helper function to validate Pakistani phone number
function isValidPhoneNumber(phone) {
    // Remove spaces and special characters
    const cleanPhone = phone.replace(/[\s\-\(\)\+]/g, '');
    
    // Pakistani phone number patterns:
    // 03XXXXXXXXX (11 digits starting with 03)
    // 3XXXXXXXXX (10 digits starting with 3)
    // 0333-1234567 (with hyphen)
    // +923331234567 (with country code)
    // 0333 1234567 (with space)
    
    const patterns = [
        /^03[0-9]{9}$/,           // 03XXXXXXXXX (11 digits)
        /^3[0-9]{9}$/,             // 3XXXXXXXXX (10 digits)
        /^923[0-9]{9}$/,           // 923XXXXXXXXX (12 digits)
        /^\+923[0-9]{9}$/,         // +923XXXXXXXXX (13 digits)
        /^0[0-9]{10}$/             // 0XXXXXXXXXX (11 digits, landline)
    ];
    
    for (let pattern of patterns) {
        if (pattern.test(cleanPhone)) {
            return true;
        }
    }
    return false;
}

// Format phone number for display
function formatPhoneNumber(phone) {
    const clean = phone.replace(/[\s\-\(\)\+]/g, '');
    if (clean.length === 11 && clean.startsWith('03')) {
        return `${clean.slice(0, 4)}-${clean.slice(4, 7)}-${clean.slice(7)}`;
    }
    return phone;
}

// Start server
app.listen(PORT, () => {
    console.log(`
========================================
🎓 TUF University Lost & Found System
========================================
🚀 Server running on: http://localhost:${PORT}
📱 Public Portal: http://localhost:${PORT}
🔐 Admin Login: http://localhost:${PORT}/login.html
🔧 Admin Panel: http://localhost:${PORT}/admin.html
💚 Health Check: http://localhost:${PORT}/health
========================================
    `);
});