const db = require("../config/db");

/**
 * Cart Data Model
 * Handles database operations for customer shopping cart.
 */
class Cart {
    /**
     * Get user cart items with product details
     * @param {number} userId 
     * @returns {Promise<Array>}
     */
    static async getByUserId(userId) {
        const sql = `
            SELECT c.cart_id, c.user_id, c.product_id, c.quantity,
                   p.product_name, p.price, p.image, p.category, p.quantity AS stock
            FROM cart c
            JOIN products p ON c.product_id = p.product_id
            WHERE c.user_id = ?
            ORDER BY c.cart_id DESC
        `;
        const [rows] = await db.promise().query(sql, [userId]);
        return rows;
    }

    /**
     * Add item to user cart or increment quantity if already present
     * @param {number} userId 
     * @param {number} productId 
     * @param {number} quantity 
     * @returns {Promise<object>}
     */
    static async addItem(userId, productId, quantity = 1) {
        const [existing] = await db.promise().query(
            "SELECT * FROM cart WHERE user_id = ? AND product_id = ?",
            [userId, productId]
        );

        if (existing.length > 0) {
            const newQty = existing[0].quantity + quantity;
            await db.promise().query(
                "UPDATE cart SET quantity = ? WHERE cart_id = ?",
                [newQty, existing[0].cart_id]
            );
            return { cartId: existing[0].cart_id, quantity: newQty, updated: true };
        } else {
            const [result] = await db.promise().query(
                "INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)",
                [userId, productId, quantity]
            );
            return { cartId: result.insertId, quantity, updated: false };
        }
    }

    /**
     * Update quantity of a cart item
     * @param {number} cartId 
     * @param {number} quantity 
     * @returns {Promise<boolean>}
     */
    static async updateQuantity(cartId, quantity) {
        const [result] = await db.promise().query(
            "UPDATE cart SET quantity = ? WHERE cart_id = ?",
            [quantity, cartId]
        );
        return result.affectedRows > 0;
    }

    /**
     * Remove item from cart by cart ID
     * @param {number} cartId 
     * @returns {Promise<boolean>}
     */
    static async removeItem(cartId) {
        const [result] = await db.promise().query(
            "DELETE FROM cart WHERE cart_id = ?",
            [cartId]
        );
        return result.affectedRows > 0;
    }

    /**
     * Clear all items in a user's cart
     * @param {number} userId 
     * @returns {Promise<boolean>}
     */
    static async clear(userId) {
        const [result] = await db.promise().query(
            "DELETE FROM cart WHERE user_id = ?",
            [userId]
        );
        return result.affectedRows > 0;
    }
}

module.exports = Cart;
