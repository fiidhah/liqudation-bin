const db = require("../config/db");

/**
 * LuckyDraw Data Model
 * Handles lucky draw events, scheduling, and winner status.
 */
class LuckyDraw {
    /**
     * Find lucky draw by ID
     * @param {number} drawId 
     * @returns {Promise<object|null>}
     */
    static async findById(drawId) {
        const sql = `
            SELECT ld.*, w.winner_id, u.full_name AS winner_name, u.email AS winner_email
            FROM lucky_draws ld
            LEFT JOIN winners w ON ld.draw_id = w.draw_id
            LEFT JOIN users u ON w.user_id = u.user_id
            WHERE ld.draw_id = ?
        `;
        const [rows] = await db.promise().query(sql, [drawId]);
        return rows[0] || null;
    }

    /**
     * Get all lucky draws with winner details
     * @returns {Promise<Array>}
     */
    static async getAll() {
        const sql = `
            SELECT 
                ld.*,
                w.winner_id,
                u.full_name AS winner_name,
                u.email AS winner_email,
                w.announced_at
            FROM lucky_draws ld
            LEFT JOIN winners w ON ld.draw_id = w.draw_id
            LEFT JOIN users u ON w.user_id = u.user_id
            ORDER BY ld.draw_date DESC
        `;
        const [rows] = await db.promise().query(sql);
        return rows;
    }

    /**
     * Create a new lucky draw event
     * @param {object} data - { draw_name, draw_date, description }
     * @returns {Promise<number>} Inserted draw ID
     */
    static async create({ draw_name, draw_date, description = "" }) {
        const [result] = await db.promise().query(
            "INSERT INTO lucky_draws (draw_name, draw_date, description) VALUES (?, ?, ?)",
            [draw_name, draw_date, description]
        );
        return result.insertId;
    }

    /**
     * Update lucky draw details
     * @param {number} drawId 
     * @param {object} data - { draw_name, draw_date, description }
     * @returns {Promise<boolean>}
     */
    static async update(drawId, { draw_name, draw_date, description }) {
        const [result] = await db.promise().query(
            "UPDATE lucky_draws SET draw_name = ?, draw_date = ?, description = ? WHERE draw_id = ?",
            [draw_name, draw_date, description, drawId]
        );
        return result.affectedRows > 0;
    }

    /**
     * Delete lucky draw by ID
     * @param {number} drawId 
     * @returns {Promise<boolean>}
     */
    static async delete(drawId) {
        const [result] = await db.promise().query(
            "DELETE FROM lucky_draws WHERE draw_id = ?",
            [drawId]
        );
        return result.affectedRows > 0;
    }
}

module.exports = LuckyDraw;
