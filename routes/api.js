const express = require('express');
const router = express.Router();
const db = require('../config/db');
const rateLimit = require('express-rate-limit');

// Rate limiting
const publicLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50,
    message: { success: false, message: 'Too many requests, please try again later.' }
});

const reportLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 10,
    message: { success: false, message: 'Report limit reached. Try again later.' }
});

// Mask CNIC for public view
function maskCNIC(cnic) {
    if (!cnic) return 'XXXXX-XXXXXXX-X';
    const parts = cnic.split('-');
    if (parts.length === 3) {
        return `XXXXX-XXXXXXX-${parts[2]}`;
    }
    return 'XXXXX-XXXXXXX-X';
}

// ============ PUBLIC ENDPOINTS ============

// Report lost item (with phone validation)
app.post('/api/report/lost', (req, res) => {
    const { name, category, cnic, contact, location, description } = req.body;
    
    // Validate CNIC
    const cnicRegex = /^[0-9]{5}-[0-9]{7}-[0-9]{1}$/;
    if (!cnicRegex.test(cnic)) {
        return res.status(400).json({ success: false, message: 'Invalid CNIC format. Use: 12345-1234567-1' });
    }
    
    // Validate Phone Number
    if (!isValidPhoneNumber(contact)) {
        return res.status(400).json({ 
            success: false, 
            message: 'Invalid phone number. Use Pakistani format: 03XXXXXXXXX (e.g., 03001234567)' 
        });
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

// Report found item (with phone validation)
app.post('/api/report/found', (req, res) => {
    const { name, category, cnic, contact, location, description } = req.body;
    
    // Validate CNIC
    const cnicRegex = /^[0-9]{5}-[0-9]{7}-[0-9]{1}$/;
    if (!cnicRegex.test(cnic)) {
        return res.status(400).json({ success: false, message: 'Invalid CNIC format. Use: 12345-1234567-1' });
    }
    
    // Validate Phone Number
    if (!isValidPhoneNumber(contact)) {
        return res.status(400).json({ 
            success: false, 
            message: 'Invalid phone number. Use Pakistani format: 03XXXXXXXXX (e.g., 03001234567)' 
        });
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

// Get lost items (public - location hidden)
router.get('/items/lost', async (req, res) => {
    try {
        const query = 'SELECT * FROM items WHERE type = "lost" ORDER BY created_at DESC';
        const result = await db.executeQuery(query);
        
        if (result.success) {
            const items = result.data.map(item => ({
                ...item,
                location: undefined,
                location_details: undefined,
                cnic: maskCNIC(item.cnic),
                contact: item.contact.replace(/[0-9]/g, '*').substring(0, 4) + '****'
            }));
            res.json({ success: true, data: items, count: items.length });
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch items' });
    }
});

// Get found items (public - location hidden)
router.get('/items/found', async (req, res) => {
    try {
        const query = 'SELECT * FROM items WHERE type = "found" ORDER BY created_at DESC';
        const result = await db.executeQuery(query);
        
        if (result.success) {
            const items = result.data.map(item => ({
                ...item,
                location: undefined,
                location_details: undefined,
                cnic: maskCNIC(item.cnic),
                contact: item.contact.replace(/[0-9]/g, '*').substring(0, 4) + '****'
            }));
            res.json({ success: true, data: items, count: items.length });
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch items' });
    }
});

// Get single item (public)
router.get('/items/:id', async (req, res) => {
    try {
        const query = 'SELECT * FROM items WHERE id = ?';
        const result = await db.executeQuery(query, [req.params.id]);
        
        if (result.success && result.data.length > 0) {
            const item = result.data[0];
            delete item.location;
            delete item.location_details;
            item.cnic = maskCNIC(item.cnic);
            res.json({ success: true, data: item });
        } else {
            res.status(404).json({ success: false, message: 'Item not found' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch item' });
    }
});

// Search items
router.get('/search', async (req, res) => {
    try {
        const { q, type } = req.query;
        
        if (!q || q.trim().length < 2) {
            return res.status(400).json({ success: false, message: 'Search keyword must be at least 2 characters' });
        }
        
        let query = `SELECT * FROM items WHERE (name LIKE ? OR category LIKE ? OR description LIKE ?)`;
        let params = [`%${q}%`, `%${q}%`, `%${q}%`];
        
        if (type && type !== 'all') {
            query += ` AND type = ?`;
            params.push(type);
        }
        
        query += ` ORDER BY created_at DESC`;
        
        const result = await db.executeQuery(query, params);
        
        if (result.success) {
            const items = result.data.map(item => ({
                ...item,
                location: undefined,
                cnic: maskCNIC(item.cnic),
                contact: item.contact.replace(/[0-9]/g, '*').substring(0, 4) + '****'
            }));
            res.json({ success: true, data: items, count: items.length, keyword: q });
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Search failed' });
    }
});

// Get statistics
router.get('/stats', async (req, res) => {
    try {
        const lostQuery = 'SELECT COUNT(*) as count FROM items WHERE type = "lost"';
        const foundQuery = 'SELECT COUNT(*) as count FROM items WHERE type = "found"';
        const todayQuery = 'SELECT COUNT(*) as count FROM items WHERE DATE(created_at) = CURDATE()';
        
        const [lostResult, foundResult, todayResult] = await Promise.all([
            db.executeQuery(lostQuery),
            db.executeQuery(foundQuery),
            db.executeQuery(todayQuery)
        ]);
        
        res.json({
            success: true,
            data: {
                lost_count: lostResult.success ? lostResult.data[0].count : 0,
                found_count: foundResult.success ? foundResult.data[0].count : 0,
                today_count: todayResult.success ? todayResult.data[0].count : 0,
                total_count: (lostResult.success ? lostResult.data[0].count : 0) + (foundResult.success ? foundResult.data[0].count : 0)
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch statistics' });
    }
});

module.exports = router;