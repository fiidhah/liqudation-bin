const db = require("../config/db");

/**
 * Payment Data Model
 * Handles checkout payment transactions and verification records.
 */
class Payment {
    /**
     * Find payment record by ID
     * @param {number} paymentId 
     * @returns {Promise<object|null>}
     */
    static async findById(paymentId) {
        const [rows] = await db.promise().query(
            "SELECT * FROM payments WHERE payment_id = ?",
            [paymentId]
        );
        return rows[0] || null;
    }

    /**
     * Find payment record by order ID
     * @param {number} orderId 
     * @returns {Promise<object|null>}
     */
    static async findByOrderId(orderId) {
        const [rows] = await db.promise().query(
            "SELECT * FROM payments WHERE order_id = ?",
            [orderId]
        );
        return rows[0] || null;
    }

    /**
     * Get all payment transaction history for a user
     * @param {number} userId 
     * @returns {Promise<Array>}
     */
    static async getByUserId(userId) {
        const sql = `
            SELECT p.*, o.order_status, o.order_date
            FROM payments p
            JOIN orders o ON p.order_id = o.order_id
            WHERE p.user_id = ?
            ORDER BY p.payment_id DESC
        `;
        const [rows] = await db.promise().query(sql, [userId]);
        return rows;
    }

    /**
     * Record a new payment transaction
     * @param {object} data - { order_id, user_id, razorpay_order_id, razorpay_payment_id, payment_status, amount }
     * @returns {Promise<number>} Inserted payment ID
     */
    static async create({
        order_id,
        user_id,
        razorpay_order_id = null,
        razorpay_payment_id = null,
        payment_status = "Pending",
        amount
    }) {
        const sql = `
            INSERT INTO payments (order_id, user_id, razorpay_order_id, razorpay_payment_id, payment_status, amount)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        const [result] = await db.promise().query(sql, [
            order_id,
            user_id,
            razorpay_order_id,
            razorpay_payment_id,
            payment_status,
            amount
        ]);
        return result.insertId;
    }

    /**
     * Update payment status
     * @param {number} paymentId 
     * @param {string} status - 'Pending' | 'Success' | 'Failed'
     * @returns {Promise<boolean>}
     */
    static async updateStatus(paymentId, status) {
        const [result] = await db.promise().query(
            "UPDATE payments SET payment_status = ? WHERE payment_id = ?",
            [status, paymentId]
        );
        return result.affectedRows > 0;
    }
}

module.exports = Payment;
