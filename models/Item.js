const db = require('../config/db');

class Item {
    // Create new item
    static async create(itemData) {
        const { type, name, category, contact, location, description } = itemData;
        const query = `
            INSERT INTO items (type, name, category, contact, location, description)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        return await db.executeQuery(query, [type, name, category, contact, location, description]);
    }

    // Get all items by type
    static async getByType(type, limit = 100, offset = 0) {
        const query = `
            SELECT * FROM items 
            WHERE type = ? 
            ORDER BY created_at DESC 
            LIMIT ? OFFSET ?
        `;
        return await db.executeQuery(query, [type, parseInt(limit), parseInt(offset)]);
    }

    // Get single item by ID
    static async getById(id) {
        const query = 'SELECT * FROM items WHERE id = ?';
        return await db.executeQuery(query, [id]);
    }

    // Search items
    static async search(keyword, type = null) {
        let query = `
            SELECT * FROM items 
            WHERE MATCH(name, category, location, description) AGAINST(? IN NATURAL LANGUAGE MODE)
            OR name LIKE ?
            OR category LIKE ?
            OR location LIKE ?
        `;
        let params = [keyword, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`];
        
        if (type && type !== 'all') {
            query += ' AND type = ?';
            params.push(type);
        }
        
        query += ' ORDER BY created_at DESC';
        
        return await db.executeQuery(query, params);
    }

    // Get statistics
    static async getStats() {
        const query = 'SELECT * FROM item_stats';
        return await db.executeQuery(query);
    }

    // Get dashboard data
    static async getDashboardData() {
        const queries = {
            recentItems: 'SELECT * FROM items ORDER BY created_at DESC LIMIT 10',
            categoryBreakdown: `
                SELECT category, type, COUNT(*) as count 
                FROM items 
                GROUP BY category, type
            `,
            weeklyTrend: `
                SELECT DATE(created_at) as date, 
                       COUNT(CASE WHEN type = 'lost' THEN 1 END) as lost,
                       COUNT(CASE WHEN type = 'found' THEN 1 END) as found
                FROM items 
                WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
                GROUP BY DATE(created_at)
                ORDER BY date DESC
            `
        };
        
        const results = {};
        for (const [key, query] of Object.entries(queries)) {
            results[key] = await db.executeQuery(query);
        }
        return results;
    }

    // Update item status
    static async updateStatus(id, status) {
        const query = 'UPDATE items SET status = ? WHERE id = ?';
        return await db.executeQuery(query, [status, id]);
    }

    // Delete item
    static async delete(id) {
        const query = 'DELETE FROM items WHERE id = ?';
        return await db.executeQuery(query, [id]);
    }

    // Get items by date range
    static async getByDateRange(startDate, endDate, type = null) {
        let query = 'SELECT * FROM items WHERE created_at BETWEEN ? AND ?';
        let params = [startDate, endDate];
        
        if (type && type !== 'all') {
            query += ' AND type = ?';
            params.push(type);
        }
        
        query += ' ORDER BY created_at DESC';
        return await db.executeQuery(query, params);
    }
}

module.exports = Item;