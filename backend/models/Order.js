const db = require("../config/db");

/**
 * Order Data Model
 * Handles customer order placement, order status lifecycle, and order history.
 */
class Order {
    /**
     * Find order by ID
     * @param {number} orderId 
     * @returns {Promise<object|null>}
     */
    static async findById(orderId) {
        const sql = `
            SELECT o.*, u.full_name, u.email, u.phone
            FROM orders o
            JOIN users u ON o.user_id = u.user_id
            WHERE o.order_id = ?
        `;
        const [rows] = await db.promise().query(sql, [orderId]);
        return rows[0] || null;
    }

    /**
     * Get all orders placed by a specific customer
     * @param {number} userId 
     * @returns {Promise<Array>}
     */
    static async getByUserId(userId) {
        const sql = `
            SELECT o.*, 
                   COUNT(oi.order_item_id) AS total_items
            FROM orders o
            LEFT JOIN order_items oi ON o.order_id = oi.order_id
            WHERE o.user_id = ?
            GROUP BY o.order_id
            ORDER BY o.order_id DESC
        `;
        const [rows] = await db.promise().query(sql, [userId]);
        return rows;
    }

    /**
     * Get all orders in the system with customer and item details
     * @returns {Promise<Array>}
     */
    static async getAll() {
        const sql = `
            SELECT o.*, u.full_name, u.email, u.phone,
                   (SELECT COUNT(*) FROM order_items WHERE order_id = o.order_id) AS items_count
            FROM orders o
            LEFT JOIN users u ON o.user_id = u.user_id
            ORDER BY o.order_id DESC
        `;
        const [rows] = await db.promise().query(sql);
        return rows;
    }

    /**
     * Create a new order record
     * @param {object} data - { user_id, total_amount, order_status }
     * @returns {Promise<number>} Inserted order ID
     */
    static async create({ user_id, total_amount, order_status = "Pending" }) {
        const [result] = await db.promise().query(
            "INSERT INTO orders (user_id, total_amount, order_status) VALUES (?, ?, ?)",
            [user_id, total_amount, order_status]
        );
        return result.insertId;
    }

    /**
     * Update fulfillment status of an order
     * @param {number} orderId 
     * @param {string} newStatus - 'Pending' | 'Confirmed' | 'Shipped' | 'Delivered' | 'Cancelled'
     * @returns {Promise<boolean>}
     */
    static async updateStatus(orderId, newStatus) {
        const [result] = await db.promise().query(
            "UPDATE orders SET order_status = ? WHERE order_id = ?",
            [newStatus, orderId]
        );
        return result.affectedRows > 0;
    }

    /**
     * Delete an order record by ID
     * @param {number} orderId 
     * @returns {Promise<boolean>}
     */
    static async delete(orderId) {
        const [result] = await db.promise().query(
            "DELETE FROM orders WHERE order_id = ?",
            [orderId]
        );
        return result.affectedRows > 0;
    }
}

module.exports = Order;
