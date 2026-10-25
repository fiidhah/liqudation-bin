const db = require("../config/db");

/**
 * Offer Data Model
 * Handles promotional discount offers and vouchers.
 */
class Offer {
    /**
     * Find offer by ID
     * @param {number} offerId 
     * @returns {Promise<object|null>}
     */
    static async findById(offerId) {
        const [rows] = await db.promise().query(
            "SELECT * FROM promotional_offers WHERE offer_id = ?",
            [offerId]
        );
        return rows[0] || null;
    }

    /**
     * Get all promotional offers
     * @returns {Promise<Array>}
     */
    static async getAll() {
        const [rows] = await db.promise().query(
            "SELECT * FROM promotional_offers ORDER BY offer_id DESC"
        );
        return rows;
    }

    /**
     * Get active promotional offers valid for current date
     * @returns {Promise<Array>}
     */
    static async getActive() {
        const today = new Date().toISOString().split("T")[0];
        const sql = `
            SELECT * FROM promotional_offers
            WHERE (status = 'Active' OR status IS NULL)
              AND start_date <= ? AND end_date >= ?
            ORDER BY discount_percentage DESC
        `;
        const [rows] = await db.promise().query(sql, [today, today]);
        return rows;
    }

    /**
     * Create a new promotional discount offer
     * @param {object} data - { title, description, discount_percentage, start_date, end_date, status }
     * @returns {Promise<number>} Inserted offer ID
     */
    static async create({
        title,
        description = "",
        discount_percentage,
        start_date,
        end_date,
        status = "Active"
    }) {
        const sql = `
            INSERT INTO promotional_offers (title, description, discount_percentage, start_date, end_date, status)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        const [result] = await db.promise().query(sql, [
            title,
            description,
            discount_percentage,
            start_date,
            end_date,
            status
        ]);
        return result.insertId;
    }

    /**
     * Update an existing offer
     * @param {number} offerId 
     * @param {object} data - { title, description, discount_percentage, start_date, end_date, status }
     * @returns {Promise<boolean>}
     */
    static async update(offerId, { title, description, discount_percentage, start_date, end_date, status }) {
        const sql = `
            UPDATE promotional_offers
            SET title = ?, description = ?, discount_percentage = ?, start_date = ?, end_date = ?, status = ?
            WHERE offer_id = ?
        `;
        const [result] = await db.promise().query(sql, [
            title,
            description,
            discount_percentage,
            start_date,
            end_date,
            status,
            offerId
        ]);
        return result.affectedRows > 0;
    }

    /**
     * Delete an offer by ID
     * @param {number} offerId 
     * @returns {Promise<boolean>}
     */
    static async delete(offerId) {
        const [result] = await db.promise().query(
            "DELETE FROM promotional_offers WHERE offer_id = ?",
            [offerId]
        );
        return result.affectedRows > 0;
    }
}

module.exports = Offer;
