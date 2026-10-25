const db = require("../config/db");

/**
 * DailyPrice Data Model
 * Handles the 7-day reverse liquidation schedule for products.
 */
class DailyPrice {
    /**
     * Get all daily prices for a specific product
     * @param {number} productId 
     * @returns {Promise<Array>}
     */
    static async getByProductId(productId) {
        const [rows] = await db.promise().query(
            "SELECT * FROM daily_prices WHERE product_id = ? ORDER BY FIELD(day_name, 'Friday', 'Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday')",
            [productId]
        );
        return rows;
    }

    /**
     * Get pricing for all products on a specific day
     * @param {string} dayName - e.g. 'Monday', 'Tuesday', etc.
     * @returns {Promise<Array>}
     */
    static async getByDay(dayName) {
        const [rows] = await db.promise().query(
            `SELECT dp.*, p.product_name, p.category, p.image, p.quantity
             FROM daily_prices dp
             JOIN products p ON dp.product_id = p.product_id
             WHERE dp.day_name = ?`,
            [dayName]
        );
        return rows;
    }

    /**
     * Set or update the price for a product on a specific day
     * @param {number} productId 
     * @param {string} dayName 
     * @param {number} price 
     * @returns {Promise<boolean>}
     */
    static async upsert(productId, dayName, price) {
        const sql = `
            INSERT INTO daily_prices (product_id, day_name, price)
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE price = VALUES(price), updated_at = CURRENT_TIMESTAMP
        `;
        const [result] = await db.promise().query(sql, [productId, dayName, price]);
        return result.affectedRows > 0;
    }

    /**
     * Delete all daily price overrides for a product
     * @param {number} productId 
     * @returns {Promise<boolean>}
     */
    static async deleteByProductId(productId) {
        const [result] = await db.promise().query(
            "DELETE FROM daily_prices WHERE product_id = ?",
            [productId]
        );
        return result.affectedRows > 0;
    }
}

module.exports = DailyPrice;
