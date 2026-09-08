const db = require("../config/db");
const { syncAllDailyPrices, getTodayDayName } = require("../utils/dailyPriceCalculator");

const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// =============================
// GET ALL DAILY PRICES
// =============================
const getAllDailyPrices = (req, res) => {
    const { product_id, day } = req.query;

    let sql = `
        SELECT dp.*, p.product_name, p.category, p.brand, p.price as base_price, p.image
        FROM daily_prices dp
        JOIN products p ON dp.product_id = p.product_id
        WHERE 1=1
    `;
    const params = [];

    if (product_id) {
        sql += " AND dp.product_id = ?";
        params.push(product_id);
    }
    if (day) {
        sql += " AND dp.day_name = ?";
        params.push(day);
    }

    sql += " ORDER BY p.product_id ASC, FIELD(dp.day_name, 'Friday', 'Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday')";

    db.query(sql, params, (err, results) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: err.message
            });
        }

        res.status(200).json({
            success: true,
            total: results.length,
            data: results
        });
    });
};

// =============================
// GET TODAY'S PRICES
// =============================
const getTodayPrices = (req, res) => {
    const todayDayName = getTodayDayName();

    const sql = `
        SELECT dp.*, p.product_name, p.category, p.brand, p.price as current_price, p.image
        FROM daily_prices dp
        JOIN products p ON dp.product_id = p.product_id
        WHERE dp.day_name = ?
    `;

    db.query(sql, [todayDayName], (err, results) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: err.message
            });
        }

        res.status(200).json({
            success: true,
            day: todayDayName,
            total: results.length,
            data: results
        });
    });
};

// =============================
// ADD / UPSERT DAILY PRICE
// =============================
const addDailyPrice = (req, res) => {
    const { product_id, day_name, price } = req.body;

    if (!product_id || !day_name || price === undefined) {
        return res.status(400).json({
            success: false,
            message: "Product ID, day name, and price are required."
        });
    }

    const numPrice = parseFloat(price);
    const sql = `
        INSERT INTO daily_prices (product_id, day_name, price)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE price = VALUES(price), updated_at = CURRENT_TIMESTAMP
    `;

    db.query(sql, [product_id, day_name, numPrice], (err, result) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: err.message
            });
        }

        const todayName = getTodayDayName();
        if (day_name.toLowerCase() === todayName.toLowerCase()) {
            db.query("UPDATE products SET price = ? WHERE product_id = ?", [numPrice, product_id]);
        }

        res.status(201).json({
            success: true,
            message: `Daily price for ${day_name} saved successfully (₹${numPrice.toFixed(2)}).`,
            priceId: result.insertId
        });
    });
};

// =============================
// UPDATE DAILY PRICE BY ID
// =============================
const updateDailyPrice = (req, res) => {
    const { id } = req.params;
    const { price, day_name } = req.body;

    if (price === undefined || isNaN(Number(price))) {
        return res.status(400).json({
            success: false,
            message: "A valid price is required."
        });
    }

    const numPrice = parseFloat(price);
    const sql = "UPDATE daily_prices SET price = ?, day_name = COALESCE(?, day_name), updated_at = CURRENT_TIMESTAMP WHERE price_id = ?";

    db.query(sql, [numPrice, day_name || null, id], (err, result) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: err.message
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Daily price entry not found."
            });
        }

        // Fetch row to see if it matches today's day
        db.query("SELECT product_id, day_name, price FROM daily_prices WHERE price_id = ?", [id], (err2, rows) => {
            if (!err2 && rows && rows.length > 0) {
                const row = rows[0];
                const todayName = getTodayDayName();
                if (row.day_name.toLowerCase() === todayName.toLowerCase()) {
                    db.query("UPDATE products SET price = ? WHERE product_id = ?", [row.price, row.product_id]);
                }
            }
        });

        res.status(200).json({
            success: true,
            message: "Daily price updated successfully."
        });
    });
};

// =============================
// SAVE FULL 7-DAY WEEKLY SCHEDULE FOR A PRODUCT
// =============================
const saveProductWeeklyPrices = (req, res) => {
    const { product_id, prices } = req.body;

    if (!product_id || !prices || typeof prices !== 'object') {
        return res.status(400).json({
            success: false,
            message: "Product ID and weekly prices object are required."
        });
    }

    const validDays = ['Friday', 'Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];
    const entries = [];

    for (const day of validDays) {
        if (prices[day] !== undefined && prices[day] !== null && !isNaN(Number(prices[day]))) {
            entries.push({ day, price: parseFloat(prices[day]) });
        }
    }

    if (entries.length === 0) {
        return res.status(400).json({
            success: false,
            message: "No valid day prices provided."
        });
    }

    let completed = 0;
    let hasError = false;
    const todayName = getTodayDayName();

    entries.forEach(entry => {
        const sql = `
            INSERT INTO daily_prices (product_id, day_name, price)
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE price = VALUES(price), updated_at = CURRENT_TIMESTAMP
        `;

        db.query(sql, [product_id, entry.day, entry.price], (err) => {
            if (err && !hasError) {
                hasError = true;
                return res.status(500).json({ success: false, message: err.message });
            }

            // If entry is today, update product current price
            if (entry.day.toLowerCase() === todayName.toLowerCase()) {
                db.query("UPDATE products SET price = ? WHERE product_id = ?", [entry.price, product_id]);
            }

            completed++;
            if (completed === entries.length && !hasError) {
                return res.status(200).json({
                    success: true,
                    message: `7-Day pricing schedule saved successfully for product #${product_id}!`,
                    productId: product_id,
                    prices
                });
            }
        });
    });
};

// =============================
// DELETE DAILY PRICE
// =============================
const deleteDailyPrice = (req, res) => {
    const { id } = req.params;

    const sql = "DELETE FROM daily_prices WHERE price_id = ?";

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
                message: "Daily price entry not found."
            });
        }

        res.status(200).json({
            success: true,
            message: "Daily price entry deleted."
        });
    });
};

// =============================
// APPLY TODAY'S DAILY PRICES TO PRODUCTS
// =============================
const applyTodayPrices = (req, res) => {
    const todayDayName = daysOfWeek[new Date().getDay()];

    const selectSql = "SELECT product_id, price FROM daily_prices WHERE day_name = ?";

    db.query(selectSql, [todayDayName], (err, rows) => {
        if (err) {
            return res.status(500).json({ success: false, message: err.message });
        }

        if (rows.length === 0) {
            return res.status(200).json({
                success: true,
                message: `No specific daily price overrides found for ${todayDayName}.`,
                affectedCount: 0
            });
        }

        let updated = 0;
        rows.forEach(r => {
            db.query("UPDATE products SET price = ? WHERE product_id = ?", [r.price, r.product_id], () => {
                updated++;
                if (updated === rows.length) {
                    res.status(200).json({
                        success: true,
                        message: `Applied ${todayDayName} prices to ${updated} products!`,
                        affectedCount: updated
                    });
                }
            });
        });
    });
};

// =============================
// GET DAILY PRICES FOR A SPECIFIC PRODUCT
// =============================
const getProductDailyPrices = (req, res) => {
    const { id } = req.params;

    const sql = `
        SELECT dp.*, p.product_name, p.price as current_price
        FROM daily_prices dp
        JOIN products p ON dp.product_id = p.product_id
        WHERE dp.product_id = ?
        ORDER BY FIELD(dp.day_name, 'Friday', 'Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday')
    `;

    db.query(sql, [id], (err, results) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: err.message
            });
        }

        res.status(200).json({
            success: true,
            productId: id,
            total: results.length,
            data: results
        });
    });
};

const autoGenerateDailyPrices = async (req, res) => {
    try {
        const result = await syncAllDailyPrices();
        res.status(200).json({
            success: true,
            message: `7-day prices generated and synchronized for ${result.totalProducts} products! Active day: ${result.today}`,
            data: result
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

module.exports = {
    getAllDailyPrices,
    getTodayPrices,
    getProductDailyPrices,
    addDailyPrice,
    updateDailyPrice,
    saveProductWeeklyPrices,
    deleteDailyPrice,
    applyTodayPrices,
    autoGenerateDailyPrices
};
