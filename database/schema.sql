-- =============================================
-- TUF University Lost & Found System
-- Database Schema
-- =============================================

-- Create and use database
CREATE DATABASE IF NOT EXISTS tuf_lost_found_db;
USE tuf_lost_found_db;

-- =============================================
-- 1. Categories Table
-- =============================================
CREATE TABLE IF NOT EXISTS categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert categories
INSERT IGNORE INTO categories (name) VALUES 
('Electronics'),
('Laptops'),
('Mobile Phones'),
('Tablets'),
('Clothing'),
('Uniform'),
('Jackets'),
('Shoes'),
('Accessories'),
('Watches'),
('Glasses'),
('Jewelry'),
('Books'),
('Textbooks'),
('Notebooks'),
('Stationery'),
('Keys'),
('ID Cards'),
('Bags'),
('Backpacks'),
('Sports Equipment'),
('Water Bottles'),
('Umbrellas'),
('Documents'),
('Certificates'),
('Money'),
('Other');

-- =============================================
-- 2. Items Table (Main Table)
-- =============================================
CREATE TABLE IF NOT EXISTS items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    type ENUM('lost', 'found') NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    cnic VARCHAR(15) NOT NULL,
    contact VARCHAR(255) NOT NULL,
    location VARCHAR(500),
    description TEXT,
    status ENUM('open', 'resolved', 'claimed') DEFAULT 'open',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_type (type),
    INDEX idx_category (category),
    INDEX idx_status (status),
    INDEX idx_cnic (cnic),
    INDEX idx_created_at (created_at),
    FULLTEXT INDEX idx_search (name, category, description)
);

-- =============================================
-- 3. Users Table (For Admin Access)
-- =============================================
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    full_name VARCHAR(100),
    role ENUM('admin', 'moderator', 'staff') DEFAULT 'staff',
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_email (email),
    INDEX idx_username (username),
    INDEX idx_role (role)
);

-- Insert default admin (password will be set via script)
INSERT IGNORE INTO users (username, email, full_name, role) VALUES 
('tuf_admin', 'admin@tuf.edu.pk', 'TUF Administrator', 'admin');

-- =============================================
-- 4. Audit Logs Table
-- =============================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    action VARCHAR(255) NOT NULL,
    item_id INT,
    details TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_action (action),
    INDEX idx_created_at (created_at),
    INDEX idx_user_id (user_id),
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- =============================================
-- 5. Claims Table (For matching lost & found)
-- =============================================
CREATE TABLE IF NOT EXISTS claims (
    id INT PRIMARY KEY AUTO_INCREMENT,
    lost_item_id INT,
    found_item_id INT,
    claimant_name VARCHAR(255) NOT NULL,
    claimant_cnic VARCHAR(15) NOT NULL,
    claimant_contact VARCHAR(255) NOT NULL,
    proof_details TEXT,
    status ENUM('pending', 'approved', 'rejected', 'completed') DEFAULT 'pending',
    approved_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_status (status),
    INDEX idx_claimant_cnic (claimant_cnic),
    
    FOREIGN KEY (lost_item_id) REFERENCES items(id) ON DELETE CASCADE,
    FOREIGN KEY (found_item_id) REFERENCES items(id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
);

-- =============================================
-- 6. Statistics View
-- =============================================
CREATE OR REPLACE VIEW item_stats AS
SELECT 
    COUNT(CASE WHEN type = 'lost' THEN 1 END) AS lost_count,
    COUNT(CASE WHEN type = 'found' THEN 1 END) AS found_count,
    COUNT(CASE WHEN type = 'lost' AND status = 'open' THEN 1 END) AS lost_open,
    COUNT(CASE WHEN type = 'found' AND status = 'open' THEN 1 END) AS found_open,
    COUNT(CASE WHEN DATE(created_at) = CURDATE() THEN 1 END) AS today_count,
    COUNT(*) AS total_count
FROM items;

-- =============================================
-- 7. Sample Data (Optional - for testing)
-- =============================================
INSERT IGNORE INTO items (type, name, category, cnic, contact, location, description, status) VALUES
('lost', 'iPhone 14 Pro Max', 'Mobile Phones', '12345-1234567-1', 'student@tuf.edu.pk', 'Main Campus - Library', 'Black color with blue cover', 'open'),
('found', 'Student ID Card', 'ID Cards', '12345-7654321-5', 'security@tuf.edu.pk', 'Security Office', 'Found near main gate - Name: Ahmed Ali', 'open'),
('lost', 'Laptop Charger', 'Electronics', '54321-7654321-3', '+923001234567', 'Computer Science Department', 'Dell laptop charger 65W', 'open'),
('found', 'Wallet', 'Accessories', '11111-2222222-3', 'helpdesk@tuf.edu.pk', 'Cafeteria', 'Brown leather wallet with cash', 'open'),
('lost', 'University ID Card', 'ID Cards', '99999-8888888-7', 'student2@tuf.edu.pk', 'Sports Complex', 'Name: Ali Raza, Registration: TUF-2024-045', 'open'),
('found', 'Water Bottle', 'Water Bottles', '55555-4444444-9', 'lostfound@tuf.edu.pk', 'Gymnasium', 'Blue Cello water bottle', 'open'),
('lost', 'Calculator', 'Electronics', '77777-3333333-2', 'student3@tuf.edu.pk', 'Room 201', 'Casio FX-991ES scientific calculator', 'open');

-- =============================================
-- 8. Verify Installation
-- =============================================
SELECT 'Database Setup Complete!' AS Status;
SHOW TABLES;
SELECT COUNT(*) AS TotalCategories FROM categories;
SELECT COUNT(*) AS TotalItems FROM items;
SELECT COUNT(*) AS TotalUsers FROM users;