/**
 * SmartBin Unified Validation Utility
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[6-9]\d{9}$/; // Standard 10-digit Indian Mobile Number

/**
 * Validates an email address.
 * @param {string} email
 * @returns {boolean}
 */
const isValidEmail = (email) => {
    if (!email || typeof email !== 'string') return false;
    return EMAIL_REGEX.test(email.trim());
};

/**
 * Validates a 10-digit phone number.
 * @param {string|number} phone
 * @returns {boolean}
 */
const isValidPhone = (phone) => {
    if (!phone) return false;
    const cleanPhone = String(phone).trim().replace(/\D/g, '');
    // Support 10 digits directly or 12 digits with 91 prefix
    if (cleanPhone.length === 12 && cleanPhone.startsWith('91')) {
        return PHONE_REGEX.test(cleanPhone.slice(2));
    }
    return PHONE_REGEX.test(cleanPhone);
};

/**
 * Validates a password (minimum 6 characters).
 * @param {string} password
 * @returns {boolean}
 */
const isValidPassword = (password) => {
    if (!password || typeof password !== 'string') return false;
    return password.length >= 6;
};

/**
 * Validates non-empty string with minimum length.
 * @param {string} str
 * @param {number} minLen
 * @returns {boolean}
 */
const isValidText = (str, minLen = 2) => {
    if (!str || typeof str !== 'string') return false;
    return str.trim().length >= minLen;
};

/**
 * Validates a positive numeric amount (e.g. price > 0).
 * @param {number|string} val
 * @returns {boolean}
 */
const isPositiveNumber = (val) => {
    const num = Number(val);
    return !isNaN(num) && isFinite(num) && num > 0;
};

/**
 * Validates a non-negative integer (e.g. stock quantity >= 0).
 * @param {number|string} val
 * @returns {boolean}
 */
const isNonNegativeInteger = (val) => {
    const num = Number(val);
    return !isNaN(num) && Number.isInteger(num) && num >= 0;
};

/**
 * Validates that start date is before or equal to end date.
 * @param {string|Date} startDate
 * @param {string|Date} endDate
 * @returns {boolean}
 */
const isValidDateRange = (startDate, endDate) => {
    if (!startDate || !endDate) return false;
    const s = new Date(startDate);
    const e = new Date(endDate);
    return !isNaN(s.getTime()) && !isNaN(e.getTime()) && s <= e;
};

module.exports = {
    isValidEmail,
    isValidPhone,
    isValidPassword,
    isValidText,
    isPositiveNumber,
    isNonNegativeInteger,
    isValidDateRange
};
