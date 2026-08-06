const db = require("../config/db");

// =============================
// ADD TO CART
// =============================
const addToCart = (req, res) => {

    const {
        user_id,
        product_id,
        quantity
    } = req.body;

    if (!user_id || !product_id) {
        return res.status(400).json({
            success: false,
            message: "User ID and Product ID are required."
        });
    }

    const sql = `
        INSERT INTO cart
        (user_id, product_id, quantity)
        VALUES (?, ?, ?)
    `;

    db.query(
        sql,
        [
            user_id,
            product_id,
            quantity || 1
        ],
        (err, result) => {

            if (err) {
                return res.status(500).json({
                    success: false,
                    message: err.message
                });
            }

            res.status(201).json({
                success: true,
                message: "Product added to cart successfully.",
                cartId: result.insertId
            });

        }
    );

};

// =============================
// VIEW CART
// =============================
const viewCart = (req, res) => {

    const { user_id } = req.params;

    const sql = `
        SELECT
            c.cart_id,
            c.quantity,
            p.product_id,
            p.product_name,
            p.description,
            p.category,
            p.brand,
            p.image
        FROM cart c
        JOIN products p
        ON c.product_id = p.product_id
        WHERE c.user_id = ?
    `;

    db.query(sql, [user_id], (err, result) => {

        if (err) {
            return res.status(500).json({
                success: false,
                message: err.message
            });
        }

        res.status(200).json({
            success: true,
            totalItems: result.length,
            data: result
        });

    });

};

// =============================
// UPDATE CART
// =============================
const updateCart = (req, res) => {

    const { id } = req.params;
    const { quantity } = req.body;

    if (!quantity) {
        return res.status(400).json({
            success: false,
            message: "Quantity is required."
        });
    }

    const sql = `
        UPDATE cart
        SET quantity = ?
        WHERE cart_id = ?
    `;

    db.query(sql, [quantity, id], (err, result) => {

        if (err) {
            return res.status(500).json({
                success: false,
                message: err.message
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Cart item not found."
            });
        }

        res.status(200).json({
            success: true,
            message: "Cart updated successfully."
        });

    });

};
// =============================
// DELETE CART ITEM
// =============================
const deleteCartItem = (req, res) => {

    const { id } = req.params;

    const sql = "DELETE FROM cart WHERE cart_id = ?";

    db.query(sql, [id], (err, result) => {

        if (err) {
            return res.status(500).json({
                success: false,
                message: err.message
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Cart item not found."
            });
        }

        res.status(200).json({
            success: true,
            message: "Cart item deleted successfully."
        });

    });

};

// =============================
// EXPORTS
// =============================
module.exports = {
    addToCart,
    viewCart,
    updateCart,
    deleteCartItem
};