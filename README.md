# TUF University Lost & Found Management System

A secure, production-ready Lost & Found management system for TUF University with CNIC validation, admin-only location visibility, and comprehensive security features.

## Features

- ✅ **CNIC Validation** - Valid Pakistani CNIC format (12345-1234567-1)
- ✅ **Location Privacy** - Location details only visible to admin
- ✅ **Secure Authentication** - JWT-based admin authentication
- ✅ **Rate Limiting** - Prevents abuse and DDoS attacks
- ✅ **XSS Protection** - Input sanitization and output encoding
- ✅ **SQL Injection Prevention** - Parameterized queries
- ✅ **Session Management** - Secure session handling
- ✅ **Audit Logs** - Complete action tracking
- ✅ **Responsive Design** - Mobile-friendly interface
- ✅ **University Branding** - TUF University theme

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MySQL
- **Frontend**: HTML5, CSS3, JavaScript
- **Security**: JWT, bcrypt, Helmet, CORS
- **Validation**: express-validator

## Installation

### Prerequisites
- Node.js (v14+)
- MySQL (v8+)
- Git

### Steps

1. Clone the repository
```bash
git clone https://github.com/tuf-university/lost-found-system.git
cd lost-found-system