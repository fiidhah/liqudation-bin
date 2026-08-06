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

module.exports = {
    addToCart
};