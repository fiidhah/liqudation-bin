const db = require("../config/db");

/**
 * Winner Data Model
 * Handles lucky draw announced winners and historical winner logs.
 */
class Winner {
    /**
     * Find winner by winner ID
     * @param {number} winnerId 
     * @returns {Promise<object|null>}
     */
    static async findById(winnerId) {
        const sql = `
            SELECT w.*, u.full_name, u.email, u.phone, ld.draw_name, ld.description AS draw_description
            FROM winners w
            JOIN users u ON w.user_id = u.user_id
            JOIN lucky_draws ld ON w.draw_id = ld.draw_id
            WHERE w.winner_id = ?
        `;
        const [rows] = await db.promise().query(sql, [winnerId]);
        return rows[0] || null;
    }

    /**
     * Get winner for a specific lucky draw
     * @param {number} drawId 
     * @returns {Promise<object|null>}
     */
    static async getByDrawId(drawId) {
        const sql = `
            SELECT w.*, u.full_name, u.email, u.phone, ld.draw_name
            FROM winners w
            JOIN users u ON w.user_id = u.user_id
            JOIN lucky_draws ld ON w.draw_id = ld.draw_id
            WHERE w.draw_id = ?
        `;
        const [rows] = await db.promise().query(sql, [drawId]);
        return rows[0] || null;
    }

    /**
     * Get all announced winners history
     * @returns {Promise<Array>}
     */
    static async getAll() {
        const sql = `
            SELECT 
                w.winner_id,
                w.draw_id,
                w.user_id,
                w.announced_at,
                u.full_name,
                u.email,
                u.phone,
                ld.draw_name,
                ld.description AS draw_description
            FROM winners w
            JOIN users u ON w.user_id = u.user_id
            JOIN lucky_draws ld ON w.draw_id = ld.draw_id
            ORDER BY w.announced_at DESC
        `;
        const [rows] = await db.promise().query(sql);
        return rows;
    }

    /**
     * Record a newly picked lucky draw winner
     * @param {object} data - { draw_id, user_id }
     * @returns {Promise<number>} Inserted winner ID
     */
    static async create({ draw_id, user_id }) {
        const [result] = await db.promise().query(
            "INSERT INTO winners (draw_id, user_id) VALUES (?, ?)",
            [draw_id, user_id]
        );
        return result.insertId;
    }

    /**
     * Delete a winner record by ID
     * @param {number} winnerId 
     * @returns {Promise<boolean>}
     */
    static async delete(winnerId) {
        const [result] = await db.promise().query(
            "DELETE FROM winners WHERE winner_id = ?",
            [winnerId]
        );
        return result.affectedRows > 0;
    }
}

module.exports = Winner;
