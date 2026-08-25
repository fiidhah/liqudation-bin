const db = require("../config/db");

// =============================
// GET ALL PRODUCTS
// =============================
const getAllProducts = (req, res) => {

    const sql = "SELECT * FROM products ORDER BY product_id DESC";

    db.query(sql, (err, result) => {

        if (err) {
            return res.status(500).json({
                success: false,
                message: err.message
            });
        }

        res.status(200).json({
            success: true,
            totalProducts: result.length,
            data: result
        });

    });

};

// =============================
// ADD PRODUCT
// =============================
const addProduct = (req, res) => {

    const {
        manager_id,
        product_name,
        description,
        category,
        brand,
        quantity,
        image
    } = req.body;

    // Check required fields
    if (!product_name) {
        return res.status(400).json({
            success: false,
            message: "Product name is required."
        });
    }

    const sql = `
        INSERT INTO products
        (
            manager_id,
            product_name,
            description,
            category,
            brand,
            quantity,
            image
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(
        sql,
        [
            manager_id,
            product_name,
            description,
            category,
            brand,
            quantity,
            image
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
                message: "Product added successfully.",
                productId: result.insertId
            });

        }
    );

};

// =============================
// GET PRODUCT BY ID
// =============================
const getProductById = (req, res) => {

    const { id } = req.params;

    const sql = "SELECT * FROM products WHERE product_id = ?";

    db.query(sql, [id], (err, result) => {

        if (err) {
            return res.status(500).json({
                success: false,
                message: err.message
            });
        }

        if (result.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Product not found."
            });
        }

        res.status(200).json({
            success: true,
            data: result[0]
        });

    });

};

// =============================
// UPDATE PRODUCT
// =============================
const updateProduct = (req, res) => {

    const { id } = req.params;

    const {
        manager_id,
        product_name,
        description,
        category,
        brand,
        quantity,
        image
    } = req.body;

    const sql = `
        UPDATE products
        SET
            manager_id = ?,
            product_name = ?,
            description = ?,
            category = ?,
            brand = ?,
            quantity = ?,
            image = ?
        WHERE product_id = ?
    `;

    db.query(
        sql,
        [
            manager_id,
            product_name,
            description,
            category,
            brand,
            quantity,
            image,
            id
        ],
        (err, result) => {

            if (err) {
                return res.status(500).json({
                    success: false,
                    message: err.message
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Product not found."
                });
            }

            res.status(200).json({
                success: true,
                message: "Product updated successfully."
            });

        }
    );

};
// =============================
// DELETE PRODUCT
// =============================
const deleteProduct = (req, res) => {

    const { id } = req.params;

    const sql = "DELETE FROM products WHERE product_id = ?";

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
                message: "Product not found."
            });
        }

        res.status(200).json({
            success: true,
            message: "Product deleted successfully."
        });

    });

};
// =============================
// UPDATE PRODUCT PRICE
// =============================
const updateProductPrice = (req, res) => {

    const { id } = req.params;
    const { price } = req.body;

    if (price === undefined || price === null || price === "") {
        return res.status(400).json({
            success: false,
            message: "Price is required."
        });
    }

    if (Number(price) < 0) {
        return res.status(400).json({
            success: false,
            message: "Price cannot be negative."
        });
    }

    const sql = `
        UPDATE products
        SET price = ?
        WHERE product_id = ?
    `;

    db.query(sql, [price, id], (err, result) => {

        if (err) {
            return res.status(500).json({
                success: false,
                message: err.message
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Product not found."
            });
        }

        res.status(200).json({
            success: true,
            message: "Product price updated successfully."
        });

    });

};
// =============================
// SEARCH PRODUCTS
// =============================
const searchProducts = (req, res) => {

    const { keyword } = req.query;

    if (!keyword) {
        return res.status(400).json({
            success: false,
            message: "Search keyword is required."
        });
    }

    const sql = `
        SELECT *
        FROM products
        WHERE
            product_name LIKE ?
            OR description LIKE ?
            OR category LIKE ?
            OR brand LIKE ?
    `;

    const searchValue = `%${keyword}%`;

    db.query(
        sql,
        [
            searchValue,
            searchValue,
            searchValue,
            searchValue
        ],
        (err, result) => {

            if (err) {
                return res.status(500).json({
                    success: false,
                    message: err.message
                });
            }

            res.status(200).json({
                success: true,
                totalProducts: result.length,
                data: result
            });

        }
    );

};

module.exports = {
    getAllProducts,
    addProduct,
    getProductById,
    updateProduct,
    deleteProduct,
    updateProductPrice,
    searchProducts
};