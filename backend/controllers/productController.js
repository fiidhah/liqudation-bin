const db = require("../config/db");
const { getTodayDayName, ensureProductDailyPrices } = require("../utils/dailyPriceCalculator");
const { isValidText, isPositiveNumber, isNonNegativeInteger } = require("../utils/validator");

// =============================
// GET ALL PRODUCTS (With Exact & Fuzzy Multi-Token Search & Dynamic Pricing)
// =============================
const getAllProducts = (req, res) => {
    const { keyword, search, q, searchTerm, category, brand, min_price, max_price, sort, day } = req.query;

    const activeDay = day || getTodayDayName();
    const searchString = (keyword || search || q || searchTerm || "").trim();

    let sql = `
        SELECT 
            p.*,
            COALESCE(dp.price, p.price) AS price,
            COALESCE(dp.price, p.price) AS today_price,
            p.price AS base_price,
            ? AS active_day
        FROM products p
        LEFT JOIN daily_prices dp ON p.product_id = dp.product_id AND dp.day_name = ?
        WHERE 1=1
    `;
    const params = [activeDay, activeDay];

    if (searchString) {
        // Check if query is a product ID (e.g. "#PRD-7", "PRD-7", "#7", "7")
        const strippedId = searchString.replace(/^[#\s]*prd[-_:\s]*/i, '').replace(/^[#\s]*/, '').trim();
        const isPureId = /^\d+$/.test(strippedId);

        if (isPureId) {
            const numericId = parseInt(strippedId);
            sql += ` AND (p.product_id = ? OR p.product_name LIKE ? OR p.brand LIKE ? OR p.category LIKE ? OR p.description LIKE ?)`;
            const term = `%${searchString}%`;
            params.push(numericId, term, term, term, term);
        } else {
            const tokens = searchString.split(/\s+/).filter(t => t.length > 0);
            tokens.forEach(token => {
                const term = `%${token}%`;
                sql += ` AND (p.product_name LIKE ? OR p.description LIKE ? OR p.brand LIKE ? OR p.category LIKE ?)`;
                params.push(term, term, term, term);
            });
        }
    }

    if (category && category !== "All") {
        sql += " AND p.category = ?";
        params.push(category);
    }

    if (brand && brand !== "All") {
        sql += " AND p.brand = ?";
        params.push(brand);
    }

    if (min_price && !isNaN(Number(min_price))) {
        sql += " AND COALESCE(dp.price, p.price) >= ?";
        params.push(Number(min_price));
    }

    if (max_price && !isNaN(Number(max_price))) {
        sql += " AND COALESCE(dp.price, p.price) <= ?";
        params.push(Number(max_price));
    }

    if (sort === "price_asc") {
        sql += " ORDER BY price ASC";
    } else if (sort === "price_desc") {
        sql += " ORDER BY price DESC";
    } else {
        sql += " ORDER BY p.product_id DESC";
    }

    db.query(sql, params, (err, products) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: err.message
            });
        }

        if (products.length === 0) {
            return res.status(200).json({
                success: true,
                totalProducts: 0,
                activeDay: activeDay,
                data: []
            });
        }

        // Fetch all 7-day daily prices for these products to attach to the response
        const productIds = products.map(p => p.product_id);
        const dpSql = "SELECT product_id, day_name, price FROM daily_prices WHERE product_id IN (?)";

        db.query(dpSql, [productIds], (dpErr, dpRows) => {
            const priceMap = {};
            (dpRows || []).forEach(row => {
                if (!priceMap[row.product_id]) {
                    priceMap[row.product_id] = {};
                }
                priceMap[row.product_id][row.day_name] = Number(row.price);
            });

            const enrichedProducts = products.map(p => {
                return {
                    ...p,
                    price: Number(p.price),
                    base_price: Number(p.base_price),
                    weekly_prices: priceMap[p.product_id] || {}
                };
            });

            res.status(200).json({
                success: true,
                totalProducts: enrichedProducts.length,
                activeDay: activeDay,
                data: enrichedProducts
            });
        });
    });
};

// =============================
// SEARCH PRODUCTS (Alias)
// =============================
const searchProducts = (req, res) => {
    return getAllProducts(req, res);
};

// =============================
// UPLOAD PRODUCT IMAGE
// =============================
const uploadProductImage = (req, res) => {
    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: "No image file provided."
        });
    }

    res.status(200).json({
        success: true,
        message: "Image uploaded successfully.",
        imageUrl: `/uploads/products/${req.file.filename}`
    });
};

// =============================
// ADD PRODUCT (With Validation)
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

    if (!isValidText(product_name, 2)) {
        return res.status(400).json({
            success: false,
            message: "Product title is required and must be at least 2 characters."
        });
    }

    if (!isPositiveNumber(price)) {
        return res.status(400).json({
            success: false,
            message: "Price must be a valid positive number greater than 0."
        });
    }

    if (quantity !== undefined && !isNonNegativeInteger(quantity)) {
        return res.status(400).json({
            success: false,
            message: "Stock quantity must be a non-negative integer."
        });
    }

    const productImage = image || (req.file ? `/uploads/products/${req.file.filename}` : "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80");
    const basePrice = Number(price);
    const stockQty = quantity !== undefined ? parseInt(quantity) : 10;

    const sql = `
        INSERT INTO products
        (manager_id, product_name, description, category, brand, price, quantity, image)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(
        sql,
        [
            manager_id || null,
            product_name.trim(),
            description ? description.trim() : "",
            category ? category.trim() : "General",
            brand ? brand.trim() : "Generic",
            basePrice,
            stockQty,
            productImage
        ],
        async (err, result) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: err.message
                });
            }

            const newProductId = result.insertId;

            // Automatically generate 7-day daily prices for this new product
            try {
                await ensureProductDailyPrices(newProductId, basePrice);
            } catch (dpErr) {
                console.error("Warning: Error generating daily prices for product:", dpErr.message);
            }

            res.status(201).json({
                success: true,
                message: "Product added and daily prices initialized successfully.",
                productId: newProductId
            });
        }
    );
};

// =============================
// GET PRODUCT BY ID
// =============================
const getProductById = (req, res) => {
    const { id } = req.params;
    const activeDay = getTodayDayName();

    const sql = `
        SELECT 
            p.*,
            COALESCE(dp.price, p.price) AS price,
            p.price AS base_price,
            ? AS active_day
        FROM products p
        LEFT JOIN daily_prices dp ON p.product_id = dp.product_id AND dp.day_name = ?
        WHERE p.product_id = ?
    `;

    db.query(sql, [activeDay, activeDay, id], (err, results) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: err.message
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Product not found."
            });
        }

        const product = results[0];

        // Fetch 7-day daily prices for this product
        const dpSql = "SELECT day_name, price FROM daily_prices WHERE product_id = ?";
        db.query(dpSql, [id], (dpErr, dpRows) => {
            const priceMap = {};
            (dpRows || []).forEach(row => {
                priceMap[row.day_name] = Number(row.price);
            });

            res.status(200).json({
                success: true,
                data: {
                    ...product,
                    price: Number(product.price),
                    base_price: Number(product.base_price),
                    weekly_prices: priceMap
                }
            });
        });
    });
};

// =============================
// UPDATE PRODUCT (With Validation)
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

    if (product_name !== undefined && !isValidText(product_name, 2)) {
        return res.status(400).json({
            success: false,
            message: "Product name must be at least 2 characters."
        });
    }

    if (price !== undefined && !isPositiveNumber(price)) {
        return res.status(400).json({
            success: false,
            message: "Price must be a valid positive number."
        });
    }

    if (quantity !== undefined && !isNonNegativeInteger(quantity)) {
        return res.status(400).json({
            success: false,
            message: "Quantity must be a non-negative integer."
        });
    }

    const productImage = req.file ? `/uploads/products/${req.file.filename}` : (image || null);

    const sql = `
        UPDATE products
        SET product_name = COALESCE(?, product_name),
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
            product_name ? product_name.trim() : null,
            description !== undefined ? description.trim() : null,
            category ? category.trim() : null,
            brand ? brand.trim() : null,
            price !== undefined ? Number(price) : null,
            quantity !== undefined ? parseInt(quantity) : null,
            productImage,
            id
        ],
        async (err, result) => {
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

            // Update daily prices if price changed
            if (price !== undefined && isPositiveNumber(price)) {
                try {
                    await ensureProductDailyPrices(id, Number(price));
                } catch (dpErr) {
                    console.error("Warning updating daily prices:", dpErr.message);
                }
            }

            res.status(200).json({
                success: true,
                message: "Product updated successfully."
            });
        }
    );
};

// =============================
// UPDATE STOCK
// =============================
const updateStock = (req, res) => {
    const { id } = req.params;
    const { quantity } = req.body;

    if (!isNonNegativeInteger(quantity)) {
        return res.status(400).json({
            success: false,
            message: "Valid non-negative quantity is required."
        });
    }

    const sql = "UPDATE products SET quantity = ? WHERE product_id = ?";

    db.query(sql, [parseInt(quantity), id], (err, result) => {
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
            message: "Stock updated successfully."
        });
    });
};

// =============================
// UPDATE PRODUCT PRICE
// =============================
const updateProductPrice = (req, res) => {
    const { id } = req.params;
    const { price } = req.body;

    if (!isPositiveNumber(price)) {
        return res.status(400).json({
            success: false,
            message: "Valid positive price is required."
        });
    }

    const sql = "UPDATE products SET price = ? WHERE product_id = ?";

    db.query(sql, [Number(price), id], async (err, result) => {
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

        try {
            await ensureProductDailyPrices(id, Number(price));
        } catch (dpErr) {
            console.error("Warning updating daily prices:", dpErr.message);
        }

        res.status(200).json({
            success: true,
            message: "Price updated successfully."
        });
    });
};

// =============================
// DELETE PRODUCT
// =============================
const deleteProduct = (req, res) => {
    const { id } = req.params;

    // Delete related records first
    db.query("DELETE FROM daily_prices WHERE product_id = ?", [id], () => {
        db.query("DELETE FROM cart WHERE product_id = ?", [id], () => {
            db.query("DELETE FROM wishlist WHERE product_id = ?", [id], () => {
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
                        message: "Product and associated records deleted successfully."
                    });
                });
            });
        });
    });
};

module.exports = {
    getAllProducts,
    searchProducts,
    uploadProductImage,
    addProduct,
    getProductById,
    updateProduct,
    updateStock,
    updateProductPrice,
    deleteProduct
};