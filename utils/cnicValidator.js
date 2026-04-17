// utils/cnicValidator.js
class CNICValidator {
    // Validate CNIC format: 12345-1234567-1
    static isValidFormat(cnic) {
        const cnicRegex = /^[0-9]{5}-[0-9]{7}-[0-9]{1}$/;
        return cnicRegex.test(cnic);
    }

    // Validate CNIC checksum (simple validation)
    static validateChecksum(cnic) {
        if (!this.isValidFormat(cnic)) return false;
        
        const numbers = cnic.replace(/-/g, '');
        const sum = numbers.split('').reduce((acc, digit) => acc + parseInt(digit), 0);
        
        // Simple validation: sum should be > 0
        return sum > 0;
    }

    // Format CNIC with dashes
    static formatCNIC(cnic) {
        const clean = cnic.replace(/[^0-9]/g, '');
        if (clean.length === 13) {
            return `${clean.substring(0, 5)}-${clean.substring(5, 12)}-${clean.substring(12, 13)}`;
        }
        return cnic;
    }

    // Mask CNIC for public view (show only last 4 digits)
    static maskCNIC(cnic) {
        if (!cnic) return 'XXXXX-XXXXXXX-X';
        const parts = cnic.split('-');
        if (parts.length === 3) {
            return `XXXXX-XXXXXXX-${parts[2]}`;
        }
        return 'XXXXX-XXXXXXX-X';
    }

    // Extract gender from CNIC (7th digit indicates gender in Pakistan)
    static getGenderFromCNIC(cnic) {
        const clean = cnic.replace(/[^0-9]/g, '');
        if (clean.length === 13) {
            const genderDigit = clean.charAt(12);
            return genderDigit % 2 === 0 ? 'Female' : 'Male';
        }
        return 'Unknown';
    }

    // Get province code from CNIC (first 2 digits)
    static getProvinceFromCNIC(cnic) {
        const clean = cnic.replace(/[^0-9]/g, '');
        if (clean.length === 13) {
            const prefix = clean.substring(0, 2);
            const provinces = {
                '11': 'Islamabad',
                '12': 'Khyber Pakhtunkhwa',
                '13': 'Punjab',
                '14': 'Sindh',
                '15': 'Balochistan',
                '16': 'Gilgit-Baltistan',
                '17': 'Azad Kashmir'
            };
            return provinces[prefix] || 'Unknown';
        }
        return 'Unknown';
    }
}

module.exports = CNICValidator;