const db = require("../config/db");

// =============================
// ADD TO CART
// =============================
const addToCart = (req, res) => {
    const { user_id, product_id, quantity } = req.body;

    if (!user_id || !product_id) {
        return res.status(400).json({
            success: false,
            message: "User ID and Product ID are required."
        });
    }

    const qtyToAdd = quantity ? parseInt(quantity) : 1;

    const checkSql = "SELECT * FROM cart WHERE user_id = ? AND product_id = ?";
    db.query(checkSql, [user_id, product_id], (err, existing) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: err.message
            });
        }

        if (existing.length > 0) {
            const newQty = existing[0].quantity + qtyToAdd;
            const updateSql = "UPDATE cart SET quantity = ? WHERE cart_id = ?";
            db.query(updateSql, [newQty, existing[0].cart_id], (err) => {
                if (err) {
                    return res.status(500).json({
                        success: false,
                        message: err.message
                    });
                }
                return res.status(200).json({
                    success: true,
                    message: "Cart item quantity updated.",
                    cartId: existing[0].cart_id,
                    quantity: newQty
                });
            });
        } else {
            const insertSql = "INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)";
            db.query(insertSql, [user_id, product_id, qtyToAdd], (err, result) => {
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
            });
        }
    });
};

// =============================
const { getTodayDayName } = require("../utils/dailyPriceCalculator");

// =============================
// VIEW CART
// =============================
const viewCart = (req, res) => {
    const { user_id } = req.params;
    const todayName = getTodayDayName();

    const sql = `
        SELECT
            c.cart_id,
            c.quantity,
            p.product_id,
            p.product_name,
            p.description,
            p.category,
            p.brand,
            COALESCE(dp.price, p.price) AS price,
            p.price AS base_price,
            p.quantity AS stock_quantity,
            p.image
        FROM cart c
        JOIN products p ON c.product_id = p.product_id
        LEFT JOIN daily_prices dp ON p.product_id = dp.product_id AND dp.day_name = ?
        WHERE c.user_id = ?
        ORDER BY c.cart_id DESC
    `;

    db.query(sql, [todayName, user_id], (err, result) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: err.message
            });
        }

        let totalAmount = 0;
        result.forEach(item => {
            totalAmount += Number(item.price) * item.quantity;
        });

        res.status(200).json({
            success: true,
            totalItems: result.length,
            totalAmount: parseFloat(totalAmount.toFixed(2)),
            data: result
        });
    });
};

// =============================
// UPDATE CART QUANTITY
// =============================
const updateCart = (req, res) => {
    const { id } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity <= 0) {
        return res.status(400).json({
            success: false,
            message: "Valid quantity is required."
        });
    }

    const sql = "UPDATE cart SET quantity = ? WHERE cart_id = ?";

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
// CLEAR USER CART
// =============================
const clearCart = (req, res) => {
    const { user_id } = req.params;

    const sql = "DELETE FROM cart WHERE user_id = ?";

    db.query(sql, [user_id], (err) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: err.message
            });
        }

        res.status(200).json({
            success: true,
            message: "Cart cleared successfully."
        });
    });
};

module.exports = {
    addToCart,
    viewCart,
    updateCart,
    deleteCartItem,
    clearCart
};