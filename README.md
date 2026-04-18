# TUF University Lost & Found Management System

A secure, production-ready Lost & Found management system for TUF University with CNIC validation, admin-only location visibility, and comprehensive security features.

## Features

- ✅ **CNIC Validation** - Valid Pakistani CNIC format (12345-1234567-1)
- ✅ **Phone Number Validation** - Pakistani phone number format
- ✅ **Location Privacy** - Location details only visible to admin
- ✅ **Secure Authentication** - Admin login with session management
- ✅ **Rate Limiting** - Prevents abuse and DDoS attacks
- ✅ **XSS Protection** - Input sanitization and output encoding
- ✅ **SQL Injection Prevention** - Parameterized queries
- ✅ **Responsive Design** - Mobile-friendly interface
- ✅ **University Branding** - TUF University theme

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MySQL / MariaDB
- **Frontend**: HTML5, CSS3, JavaScript
- **Security**: bcrypt, Helmet, CORS
- **Validation**: express-validator

## Installation

### Prerequisites
- Node.js (v14+)
- MySQL / MariaDB (v10+)
- XAMPP (Recommended for Windows)
- Git

### Steps

1. Clone the repository
```bash
git clone https://github.com/Ammar-creater/tuf-lost-found-system.git
cd tuf-lost-found-system
## 🌐 Cloudflare Tunnel Setup (Public Access)

To make your local server accessible online without deployment:

### Prerequisites
- Your app running locally on port 3000
- Cloudflare account (free)

### Installation

**Windows (using winget):**
```bash
winget install cloudflare.cloudflared
