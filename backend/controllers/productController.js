const db = require("../config/db");

// =============================
// GET ALL PRODUCTS
// =============================
const getAllProducts = (req, res) => {
    const { keyword, category, brand, min_price, max_price, sort } = req.query;

    let sql = "SELECT * FROM products WHERE 1=1";
    const params = [];

    if (keyword) {
        sql += " AND (product_name LIKE ? OR description LIKE ? OR brand LIKE ? OR category LIKE ?)";
        const searchTerm = `%${keyword}%`;
        params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (category && category !== "All") {
        sql += " AND category = ?";
        params.push(category);
    }

    if (brand && brand !== "All") {
        sql += " AND brand = ?";
        params.push(brand);
    }

    if (min_price) {
        sql += " AND price >= ?";
        params.push(Number(min_price));
    }

    if (max_price) {
        sql += " AND price <= ?";
        params.push(Number(max_price));
    }

    if (sort === "price_asc") {
        sql += " ORDER BY price ASC";
    } else if (sort === "price_desc") {
        sql += " ORDER BY price DESC";
    } else {
        sql += " ORDER BY product_id DESC";
    }

    db.query(sql, params, (err, result) => {
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
        price,
        quantity,
        image
    } = req.body;

    if (!product_name) {
        return res.status(400).json({
            success: false,
            message: "Product name is required."
        });
    }

    const productImage = image || (req.file ? `/uploads/products/${req.file.filename}` : "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80");

    const sql = `
        INSERT INTO products
        (manager_id, product_name, description, category, brand, price, quantity, image)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(
        sql,
        [
            manager_id || null,
            product_name,
            description || "",
            category || "General",
            brand || "Generic",
            price || 0.00,
            quantity !== undefined ? quantity : 0,
            productImage
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
        product_name,
        description,
        category,
        brand,
        price,
        quantity,
        image
    } = req.body;

    const sql = `
        UPDATE products
        SET
            product_name = COALESCE(?, product_name),
            description = COALESCE(?, description),
            category = COALESCE(?, category),
            brand = COALESCE(?, brand),
            price = COALESCE(?, price),
            quantity = COALESCE(?, quantity),
            image = COALESCE(?, image)
        WHERE product_id = ?
    `;

    db.query(
        sql,
        [
            product_name,
            description,
            category,
            brand,
            price,
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
// UPDATE PRODUCT STOCK / INVENTORY
// =============================
const updateStock = (req, res) => {
    const { id } = req.params;
    const { quantity } = req.body;

    if (quantity === undefined || quantity === null) {
        return res.status(400).json({
            success: false,
            message: "Quantity is required."
        });
    }

    const sql = "UPDATE products SET quantity = ? WHERE product_id = ?";

    db.query(sql, [quantity, id], (err, result) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: err.message
            });
        }

        res.status(200).json({
            success: true,
            message: "Inventory stock updated successfully."
        });
    });
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

    const sql = "UPDATE products SET price = ? WHERE product_id = ?";

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
        [searchValue, searchValue, searchValue, searchValue],
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

// =============================
// UPLOAD PRODUCT IMAGE
// =============================
const uploadProductImage = (req, res) => {
    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: "No image file uploaded."
        });
    }

    const imageUrl = `/uploads/products/${req.file.filename}`;
    res.status(200).json({
        success: true,
        message: "Image uploaded successfully.",
        imageUrl: imageUrl
    });
};

module.exports = {
    getAllProducts,
    addProduct,
    getProductById,
    updateProduct,
    updateStock,
    deleteProduct,
    updateProductPrice,
    searchProducts,
    uploadProductImage
};