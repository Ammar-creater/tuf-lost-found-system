const Item = require('../models/Item');
const CNICValidator = require('../utils/cnicValidator');

class ItemController {
    // Get items for public view (location hidden)
    async getPublicItems(req, res) {
        try {
            const { type } = req.params;
            const result = await Item.getByType(type);
            
            if (result.success) {
                // Remove location and CNIC from public view
                const sanitizedItems = result.data.map(item => ({
                    ...item,
                    location: undefined, // Hide location from public
                    location_details: undefined,
                    cnic: CNICValidator.maskCNIC(item.cnic), // Mask CNIC
                    contact: item.contact.replace(/[0-9]/g, '*').substring(0, 4) + '****' // Mask contact
                }));
                
                res.json({
                    success: true,
                    data: sanitizedItems,
                    count: sanitizedItems.length
                });
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to fetch items',
                error: error.message
            });
        }
    }

    // Get items for admin (full details including location)
    async getAdminItems(req, res) {
        try {
            const { type } = req.params;
            const result = await Item.getByType(type);
            
            if (result.success) {
                // Log admin access
                await Item.logAudit(req.user.id, 'VIEW_ADMIN_ITEMS', null, {
                    type,
                    ip: req.ip
                });
                
                res.json({
                    success: true,
                    data: result.data,
                    count: result.data.length
                });
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to fetch items',
                error: error.message
            });
        }
    }

    // Get single item (public view - no location)
    async getPublicItem(req, res) {
        try {
            const { id } = req.params;
            const result = await Item.getById(id);
            
            if (result.success && result.data.length > 0) {
                const item = result.data[0];
                // Remove sensitive info for public
                delete item.location;
                delete item.location_details;
                item.cnic = CNICValidator.maskCNIC(item.cnic);
                
                res.json({
                    success: true,
                    data: item
                });
            } else {
                res.status(404).json({
                    success: false,
                    message: 'Item not found'
                });
            }
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to fetch item',
                error: error.message
            });
        }
    }

    // Get single item for admin (full details)
    async getAdminItem(req, res) {
        try {
            const { id } = req.params;
            const result = await Item.getById(id);
            
            if (result.success && result.data.length > 0) {
                await Item.logAudit(req.user.id, 'VIEW_ADMIN_ITEM', id, {
                    ip: req.ip
                });
                
                res.json({
                    success: true,
                    data: result.data[0]
                });
            } else {
                res.status(404).json({
                    success: false,
                    message: 'Item not found'
                });
            }
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to fetch item',
                error: error.message
            });
        }
    }

    // ... rest of the controller methods
}

module.exports = new ItemController();