const db = require("../config/db");

/**
 * Manager Data Model
 * Handles database operations for Store Managers.
 */
class Manager {
    /**
     * Find manager by ID
     * @param {number} id 
     * @returns {Promise<object|null>}
     */
    static async findById(id) {
        const [rows] = await db.promise().query(
            "SELECT manager_id, full_name, email, phone, address, created_at FROM managers WHERE manager_id = ?",
            [id]
        );
        return rows[0] || null;
    }

    /**
     * Find manager by email address
     * @param {string} email 
     * @returns {Promise<object|null>}
     */
    static async findByEmail(email) {
        const [rows] = await db.promise().query(
            "SELECT * FROM managers WHERE email = ?",
            [email]
        );
        return rows[0] || null;
    }

    /**
     * Get all store managers
     * @returns {Promise<Array>}
     */
    static async getAll() {
        const [rows] = await db.promise().query(
            "SELECT manager_id, full_name, email, phone, address, created_at FROM managers ORDER BY manager_id DESC"
        );
        return rows;
    }

    /**
     * Create a new store manager
     * @param {object} data - { full_name, email, password, phone, address }
     * @returns {Promise<number>} Inserted manager ID
     */
    static async create({ full_name, email, password, phone = null, address = null }) {
        const [result] = await db.promise().query(
            "INSERT INTO managers (full_name, email, password, phone, address) VALUES (?, ?, ?, ?, ?)",
            [full_name, email, password, phone, address]
        );
        return result.insertId;
    }

    /**
     * Update store manager details
     * @param {number} id 
     * @param {object} data - { full_name, email, phone, address }
     * @returns {Promise<boolean>}
     */
    static async update(id, { full_name, email, phone, address }) {
        const [result] = await db.promise().query(
            "UPDATE managers SET full_name = ?, email = ?, phone = ?, address = ? WHERE manager_id = ?",
            [full_name, email, phone, address, id]
        );
        return result.affectedRows > 0;
    }

    /**
     * Delete manager by ID
     * @param {number} id 
     * @returns {Promise<boolean>}
     */
    static async delete(id) {
        const [result] = await db.promise().query(
            "DELETE FROM managers WHERE manager_id = ?",
            [id]
        );
        return result.affectedRows > 0;
    }
}

module.exports = Manager;
