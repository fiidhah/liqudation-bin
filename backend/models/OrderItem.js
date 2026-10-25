const db = require("../config/db");

/**
 * OrderItem Data Model
 * Handles individual line items within placed customer orders.
 */
class OrderItem {
    /**
     * Get all purchased items for a specific order
     * @param {number} orderId 
     * @returns {Promise<Array>}
     */
    static async getByOrderId(orderId) {
        const sql = `
            SELECT oi.*, p.product_name, p.image, p.category, p.brand
            FROM order_items oi
            JOIN products p ON oi.product_id = p.product_id
            WHERE oi.order_id = ?
        `;
        const [rows] = await db.promise().query(sql, [orderId]);
        return rows;
    }

    /**
     * Create an individual order item record
     * @param {object} data - { order_id, product_id, quantity, price }
     * @returns {Promise<number>} Inserted order_item_id
     */
    static async create({ order_id, product_id, quantity = 1, price = 0 }) {
        const [result] = await db.promise().query(
            "INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)",
            [order_id, product_id, quantity, price]
        );
        return result.insertId;
    }

    /**
     * Batch insert multiple order items
     * @param {Array<object>} items - [{ order_id, product_id, quantity, price }]
     * @returns {Promise<number>} Number of affected rows
     */
    static async createBulk(items) {
        if (!items || items.length === 0) return 0;
        const values = items.map(item => [item.order_id, item.product_id, item.quantity, item.price]);
        const sql = "INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ?";
        const [result] = await db.promise().query(sql, [values]);
        return result.affectedRows;
    }

    /**
     * Delete order items by order ID
     * @param {number} orderId 
     * @returns {Promise<boolean>}
     */
    static async deleteByOrderId(orderId) {
        const [result] = await db.promise().query(
            "DELETE FROM order_items WHERE order_id = ?",
            [orderId]
        );
        return result.affectedRows > 0;
    }
}

module.exports = OrderItem;
