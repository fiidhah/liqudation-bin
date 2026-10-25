const db = require("../config/db");

/**
 * CartItem Data Model
 * Handles individual line item operations within shopping carts.
 */
class CartItem {
    /**
     * Find item by cart_item_id
     * @param {number} cartItemId 
     * @returns {Promise<object|null>}
     */
    static async findById(cartItemId) {
        const [rows] = await db.promise().query(
            "SELECT * FROM cart_items WHERE cart_item_id = ?",
            [cartItemId]
        );
        return rows[0] || null;
    }

    /**
     * Get all items belonging to a specific cart
     * @param {number} cartId 
     * @returns {Promise<Array>}
     */
    static async getByCartId(cartId) {
        const sql = `
            SELECT ci.*, p.product_name, p.price, p.image
            FROM cart_items ci
            JOIN products p ON ci.product_id = p.product_id
            WHERE ci.cart_id = ?
        `;
        const [rows] = await db.promise().query(sql, [cartId]);
        return rows;
    }

    /**
     * Create/insert a new cart line item
     * @param {object} data - { cart_id, product_id, quantity }
     * @returns {Promise<number>} Inserted cart_item_id
     */
    static async create({ cart_id, product_id, quantity = 1 }) {
        const [result] = await db.promise().query(
            "INSERT INTO cart_items (cart_id, product_id, quantity) VALUES (?, ?, ?)",
            [cart_id, product_id, quantity]
        );
        return result.insertId;
    }

    /**
     * Update quantity of a cart item
     * @param {number} cartItemId 
     * @param {number} quantity 
     * @returns {Promise<boolean>}
     */
    static async updateQuantity(cartItemId, quantity) {
        const [result] = await db.promise().query(
            "UPDATE cart_items SET quantity = ? WHERE cart_item_id = ?",
            [quantity, cartItemId]
        );
        return result.affectedRows > 0;
    }

    /**
     * Delete a line item from a cart
     * @param {number} cartItemId 
     * @returns {Promise<boolean>}
     */
    static async delete(cartItemId) {
        const [result] = await db.promise().query(
            "DELETE FROM cart_items WHERE cart_item_id = ?",
            [cartItemId]
        );
        return result.affectedRows > 0;
    }
}

module.exports = CartItem;
