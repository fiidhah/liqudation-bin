const db = require("../config/db");

const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// =============================
// GET ALL DAILY PRICES
// =============================
const getAllDailyPrices = (req, res) => {
    const sql = `
        SELECT dp.*, p.product_name, p.category, p.brand, p.price as base_price, p.image
        FROM daily_prices dp
        JOIN products p ON dp.product_id = p.product_id
        ORDER BY dp.price_id DESC
    `;

    db.query(sql, (err, results) => {
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
    const todayDayName = daysOfWeek[new Date().getDay()];

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
// ADD DAILY PRICE
// =============================
const addDailyPrice = (req, res) => {
    const { product_id, day_name, price } = req.body;

    if (!product_id || !day_name || price === undefined) {
        return res.status(400).json({
            success: false,
            message: "Product ID, day name, and price are required."
        });
    }

    const sql = "INSERT INTO daily_prices (product_id, day_name, price) VALUES (?, ?, ?)";

    db.query(sql, [product_id, day_name, price], (err, result) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: err.message
            });
        }

        res.status(201).json({
            success: true,
            message: "Daily price configured successfully.",
            priceId: result.insertId
        });
    });
};

// =============================
// UPDATE DAILY PRICE
// =============================
const updateDailyPrice = (req, res) => {
    const { id } = req.params;
    const { price, day_name } = req.body;

    const sql = "UPDATE daily_prices SET price = COALESCE(?, price), day_name = COALESCE(?, day_name) WHERE price_id = ?";

    db.query(sql, [price, day_name, id], (err, result) => {
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
            message: "Daily price updated successfully."
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

module.exports = {
    getAllDailyPrices,
    getTodayPrices,
    addDailyPrice,
    updateDailyPrice,
    deleteDailyPrice,
    applyTodayPrices
};
