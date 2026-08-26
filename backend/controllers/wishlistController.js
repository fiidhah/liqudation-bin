const db = require("../config/db");

// =============================
// ADD TO WISHLIST
// =============================
const addToWishlist = (req, res) => {
    const { user_id, product_id } = req.body;

    if (!user_id || !product_id) {
        return res.status(400).json({
            success: false,
            message: "User ID and Product ID are required."
        });
    }

    const checkSql = "SELECT * FROM wishlist WHERE user_id = ? AND product_id = ?";

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

        const insertSql = "INSERT INTO wishlist (user_id, product_id) VALUES (?, ?)";

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

// =============================
// VIEW WISHLIST
// =============================
const viewWishlist = (req, res) => {
    const { user_id } = req.params;

    const sql = `
        SELECT
            w.wishlist_id,
            p.product_id,
            p.product_name,
            p.description,
            p.category,
            p.brand,
            p.price,
            p.quantity,
            p.image
        FROM wishlist w
        JOIN products p ON w.product_id = p.product_id
        WHERE w.user_id = ?
        ORDER BY w.wishlist_id DESC
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
// DELETE WISHLIST ITEM
// =============================
const deleteWishlistItem = (req, res) => {
    const { id } = req.params;

    const sql = "DELETE FROM wishlist WHERE wishlist_id = ?";

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
                message: "Wishlist item not found."
            });
        }

        res.status(200).json({
            success: true,
            message: "Wishlist item removed successfully."
        });
    });
};

module.exports = {
    addToWishlist,
    viewWishlist,
    deleteWishlistItem
};