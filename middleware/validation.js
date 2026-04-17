const { body, query, param, validationResult } = require('express-validator');
const CNICValidator = require('../utils/cnicValidator');

// Custom CNIC validation
const isValidCNIC = (value) => {
    if (!value) return false;
    return CNICValidator.isValidFormat(value) && CNICValidator.validateChecksum(value);
};

const validateItem = {
    reportLost: [
        body('name')
            .trim()
            .notEmpty().withMessage('Item name is required')
            .isLength({ min: 2, max: 255 }).withMessage('Name must be between 2 and 255 characters')
            .escape(),
        body('category')
            .trim()
            .notEmpty().withMessage('Category is required')
            .isLength({ max: 100 }).withMessage('Category too long')
            .escape(),
        body('cnic')
            .trim()
            .notEmpty().withMessage('CNIC is required')
            .custom(isValidCNIC).withMessage('Invalid CNIC format. Use format: 12345-1234567-1')
            .escape(),
        body('contact')
            .trim()
            .notEmpty().withMessage('Contact information is required')
            .isLength({ max: 255 }).withMessage('Contact too long')
            .escape(),
        body('location')
            .optional()
            .trim()
            .isLength({ max: 500 }).withMessage('Location too long')
            .escape(),
        body('description')
            .optional()
            .trim()
            .isLength({ max: 1000 }).withMessage('Description too long')
            .escape()
    ],
    reportFound: [
        body('name')
            .trim()
            .notEmpty().withMessage('Item name is required')
            .isLength({ min: 2, max: 255 }).withMessage('Name must be between 2 and 255 characters')
            .escape(),
        body('category')
            .trim()
            .notEmpty().withMessage('Category is required')
            .isLength({ max: 100 }).withMessage('Category too long')
            .escape(),
        body('cnic')
            .trim()
            .notEmpty().withMessage('CNIC is required')
            .custom(isValidCNIC).withMessage('Invalid CNIC format. Use format: 12345-1234567-1')
            .escape(),
        body('contact')
            .trim()
            .notEmpty().withMessage('Contact information is required')
            .isLength({ max: 255 }).withMessage('Contact too long')
            .escape(),
        body('location')
            .optional()
            .trim()
            .isLength({ max: 500 }).withMessage('Location too long')
            .escape(),
        body('description')
            .optional()
            .trim()
            .isLength({ max: 1000 }).withMessage('Description too long')
            .escape()
    ],
    search: [
        query('q')
            .trim()
            .notEmpty().withMessage('Search keyword is required')
            .isLength({ min: 2 }).withMessage('Search keyword must be at least 2 characters')
            .escape(),
        query('type')
            .optional()
            .isIn(['lost', 'found', 'all']).withMessage('Invalid item type')
    ],
    login: [
        body('username')
            .trim()
            .notEmpty().withMessage('Username is required')
            .escape(),
        body('password')
            .notEmpty().withMessage('Password is required')
    ]
};

// Validation result handler
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array(),
            message: 'Validation failed'
        });
    }
    next();
};

module.exports = { validateItem, handleValidationErrors };