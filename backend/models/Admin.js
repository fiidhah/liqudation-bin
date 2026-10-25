const db = require("../config/db");

/**
 * Admin Data Model
 * Handles database operations for Administrator accounts.
 */
class Admin {
    /**
     * Find admin by ID
     * @param {number} id 
     * @returns {Promise<object|null>}
     */
    static async findById(id) {
        const [rows] = await db.promise().query(
            "SELECT admin_id, full_name, email, phone, created_at FROM admins WHERE admin_id = ?",
            [id]
        );
        return rows[0] || null;
    }

    /**
     * Find admin by email address (includes password hash for auth)
     * @param {string} email 
     * @returns {Promise<object|null>}
     */
    static async findByEmail(email) {
        const [rows] = await db.promise().query(
            "SELECT * FROM admins WHERE email = ?",
            [email]
        );
        return rows[0] || null;
    }

    /**
     * Create a new administrator account
     * @param {object} data - { full_name, email, password, phone }
     * @returns {Promise<number>} Inserted admin ID
     */
    static async create({ full_name, email, password, phone = null }) {
        const [result] = await db.promise().query(
            "INSERT INTO admins (full_name, email, password, phone) VALUES (?, ?, ?, ?)",
            [full_name, email, password, phone]
        );
        return result.insertId;
    }

    /**
     * Get all administrators
     * @returns {Promise<Array>}
     */
    static async getAll() {
        const [rows] = await db.promise().query(
            "SELECT admin_id, full_name, email, phone, created_at FROM admins ORDER BY admin_id DESC"
        );
        return rows;
    }

    /**
     * Delete admin by ID
     * @param {number} id 
     * @returns {Promise<boolean>}
     */
    static async delete(id) {
        const [result] = await db.promise().query(
            "DELETE FROM admins WHERE admin_id = ?",
            [id]
        );
        return result.affectedRows > 0;
    }
}

module.exports = Admin;
