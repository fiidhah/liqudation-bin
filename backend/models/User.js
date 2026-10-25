const db = require("../config/db");

/**
 * User Data Model
 * Handles database operations for Customers / Registered Users.
 */
class User {
    /**
     * Find user by ID
     * @param {number} id 
     * @returns {Promise<object|null>}
     */
    static async findById(id) {
        const [rows] = await db.promise().query(
            "SELECT user_id, full_name, email, phone, address, created_at FROM users WHERE user_id = ?",
            [id]
        );
        return rows[0] || null;
    }

    /**
     * Find user by email address (includes password for authentication)
     * @param {string} email 
     * @returns {Promise<object|null>}
     */
    static async findByEmail(email) {
        const [rows] = await db.promise().query(
            "SELECT * FROM users WHERE email = ?",
            [email]
        );
        return rows[0] || null;
    }

    /**
     * Get all registered users
     * @returns {Promise<Array>}
     */
    static async getAll() {
        const [rows] = await db.promise().query(
            "SELECT user_id, full_name, email, phone, address, created_at FROM users ORDER BY user_id DESC"
        );
        return rows;
    }

    /**
     * Create a new customer account
     * @param {object} data - { full_name, email, password, phone, address }
     * @returns {Promise<number>} Inserted user ID
     */
    static async create({ full_name, email, password, phone = null, address = null }) {
        const [result] = await db.promise().query(
            "INSERT INTO users (full_name, email, password, phone, address) VALUES (?, ?, ?, ?, ?)",
            [full_name, email, password, phone, address]
        );
        return result.insertId;
    }

    /**
     * Update customer profile details
     * @param {number} id 
     * @param {object} data - { full_name, phone, address }
     * @returns {Promise<boolean>}
     */
    static async updateProfile(id, { full_name, phone, address }) {
        const [result] = await db.promise().query(
            "UPDATE users SET full_name = ?, phone = ?, address = ? WHERE user_id = ?",
            [full_name, phone, address, id]
        );
        return result.affectedRows > 0;
    }

    /**
     * Update user password
     * @param {number} id 
     * @param {string} newHashedPassword 
     * @returns {Promise<boolean>}
     */
    static async updatePassword(id, newHashedPassword) {
        const [result] = await db.promise().query(
            "UPDATE users SET password = ? WHERE user_id = ?",
            [newHashedPassword, id]
        );
        return result.affectedRows > 0;
    }

    /**
     * Delete user by ID
     * @param {number} id 
     * @returns {Promise<boolean>}
     */
    static async delete(id) {
        const [result] = await db.promise().query(
            "DELETE FROM users WHERE user_id = ?",
            [id]
        );
        return result.affectedRows > 0;
    }
}

module.exports = User;
