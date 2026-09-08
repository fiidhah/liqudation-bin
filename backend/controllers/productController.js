const db = require("../config/db");
const { getTodayDayName, ensureProductDailyPrices } = require("../utils/dailyPriceCalculator");

// =============================
// GET ALL PRODUCTS (With Dynamic Daily Pricing)
// =============================
const getAllProducts = (req, res) => {
    const { keyword, category, brand, min_price, max_price, sort, day } = req.query;

    const activeDay = day || getTodayDayName();

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

    if (keyword) {
        sql += " AND (p.product_name LIKE ? OR p.description LIKE ? OR p.brand LIKE ? OR p.category LIKE ?)";
        const searchTerm = `%${keyword}%`;
        params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (category && category !== "All") {
        sql += " AND p.category = ?";
        params.push(category);
    }

    if (brand && brand !== "All") {
        sql += " AND p.brand = ?";
        params.push(brand);
    }

    if (min_price) {
        sql += " AND COALESCE(dp.price, p.price) >= ?";
        params.push(Number(min_price));
    }

    if (max_price) {
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
    const basePrice = Number(price) || 0.00;

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
            basePrice,
            quantity !== undefined ? quantity : 0,
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
                message: "Product added and 7-day daily prices configured successfully.",
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
    const { day } = req.query;
    const activeDay = day || getTodayDayName();

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

    db.query(sql, [activeDay, activeDay, id], (err, result) => {
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

        const product = result[0];
        product.price = Number(product.price);
        product.base_price = Number(product.base_price);

        // Fetch full 7-day schedule for this product
        db.query(
            "SELECT day_name, price FROM daily_prices WHERE product_id = ? ORDER BY price_id",
            [id],
            (dpErr, dpRows) => {
                const weeklyPrices = {};
                (dpRows || []).forEach(r => {
                    weeklyPrices[r.day_name] = Number(r.price);
                });

                product.weekly_prices = weeklyPrices;
                product.daily_price_list = dpRows || [];

                res.status(200).json({
                    success: true,
                    activeDay: activeDay,
                    data: product
                });
            }
        );
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

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Product not found."
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
    const { keyword, day } = req.query;
    const activeDay = day || getTodayDayName();

    if (!keyword) {
        return res.status(400).json({
            success: false,
            message: "Search keyword is required."
        });
    }

    const sql = `
        SELECT 
            p.*,
            COALESCE(dp.price, p.price) AS price,
            p.price AS base_price,
            ? AS active_day
        FROM products p
        LEFT JOIN daily_prices dp ON p.product_id = dp.product_id AND dp.day_name = ?
        WHERE
            p.product_name LIKE ?
            OR p.description LIKE ?
            OR p.category LIKE ?
            OR p.brand LIKE ?
    `;

    const searchValue = `%${keyword}%`;

    db.query(
        sql,
        [activeDay, activeDay, searchValue, searchValue, searchValue, searchValue],
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
                activeDay: activeDay,
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