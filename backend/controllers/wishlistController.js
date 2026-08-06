const db = require("../config/db");

// =============================
// ADD TO WISHLIST
// =============================
const addToWishlist = (req, res) => {

    const {
        user_id,
        product_id
    } = req.body;

    if (!user_id || !product_id) {
        return res.status(400).json({
            success: false,
            message: "User ID and Product ID are required."
        });
    }

    // Check if already exists
    const checkSql = `
        SELECT * FROM wishlist
        WHERE user_id = ? AND product_id = ?
    `;

    db.query(checkSql, [user_id, product_id], (err, result) => {

        if (err) {
            return res.status(500).json({
                success: false,
                message: err.message
            });
        }

        if (result.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Product already exists in wishlist."
            });
        }

        const insertSql = `
            INSERT INTO wishlist (user_id, product_id)
            VALUES (?, ?)
        `;

        db.query(insertSql, [user_id, product_id], (err, result) => {

            if (err) {
                return res.status(500).json({
                    success: false,
                    message: err.message
                });
            }

            res.status(201).json({
                success: true,
                message: "Product added to wishlist successfully.",
                wishlistId: result.insertId
            });

        });

    });

};

module.exports = {
    addToWishlist
};