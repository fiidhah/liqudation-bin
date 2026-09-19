const db = require("../config/db");

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Official Liquidation Bin Store Markdown Schedule matching Storefront
const LIQUIDATION_DAILY_PRICES = {
    Friday: 999.00,    // Restock Day (Highest Value, Fresh Loads)
    Saturday: 799.00,  // Weekend Rush
    Sunday: 599.00,    // Weekend Drop
    Monday: 399.00,    // Markdown Monday
    Tuesday: 299.00,   // Value Tuesday
    Wednesday: 199.00, // Blowout Wednesday
    Thursday: 99.00    // Clearance Day (All Bins Lowest Price)
};

const getTodayDayName = () => {
    return DAYS_OF_WEEK[new Date().getDay()];
};

/**
 * Returns the exact scheduled liquidation price for a given day name.
 */
const calculatePriceForDay = (basePrice, dayName) => {
    return LIQUIDATION_DAILY_PRICES[dayName] !== undefined ? LIQUIDATION_DAILY_PRICES[dayName] : 299.00;
};

/**
 * Ensures a single product has all 7 daily liquidation prices configured.
 */
const ensureProductDailyPrices = (productId) => {
    return new Promise((resolve, reject) => {
        const pId = parseInt(productId);
        const daysToInsert = ['Friday', 'Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];

        db.query("SELECT day_name FROM daily_prices WHERE product_id = ?", [pId], async (err) => {
            if (err) return reject(err);

            for (const day of daysToInsert) {
                const dayPrice = LIQUIDATION_DAILY_PRICES[day];
                await new Promise((res) => {
                    db.query(
                        `INSERT INTO daily_prices (product_id, day_name, price)
                         VALUES (?, ?, ?)
                         ON DUPLICATE KEY UPDATE price = VALUES(price), updated_at = CURRENT_TIMESTAMP`,
                        [pId, day, dayPrice],
                        () => res()
                    );
                });
            }
            resolve(true);
        });
    });
};

/**
 * Ensures every product in database has all 7 daily prices populated with the schedule,
 * and updates products.price to TODAY's exact scheduled liquidated price.
 */
const syncAllDailyPrices = () => {
    return new Promise((resolve, reject) => {
        const daysToInsert = ['Friday', 'Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];
        const todayName = getTodayDayName();
        const todayPrice = LIQUIDATION_DAILY_PRICES[todayName] || 299.00;

        db.query("SELECT product_id FROM products", async (err, products) => {
            if (err) return reject(err);

            for (const p of products) {
                for (const day of daysToInsert) {
                    const dPrice = LIQUIDATION_DAILY_PRICES[day];
                    await new Promise((r) => {
                        db.query(
                            `INSERT INTO daily_prices (product_id, day_name, price)
                             VALUES (?, ?, ?)
                             ON DUPLICATE KEY UPDATE price = VALUES(price)`,
                            [p.product_id, day, dPrice],
                            () => r()
                        );
                    });
                }
            }

            // Automatically set all products' current active price to today's scheduled price
            db.query(
                "UPDATE products SET price = ?",
                [todayPrice],
                (upErr, upRes) => {
                    if (upErr) console.error("Error updating today's product prices:", upErr.message);
                    console.log(`🏷️ [SCHEDULE AUTO-SYNC] All ${products.length} products automatically set to ${todayName}'s price: ₹${todayPrice}`);
                    resolve({
                        success: true,
                        today: todayName,
                        todayPrice: todayPrice,
                        totalProducts: products.length,
                        updatedCount: upRes ? upRes.affectedRows : 0
                    });
                }
            );
        });
    });
};

module.exports = {
    DAYS_OF_WEEK,
    LIQUIDATION_DAILY_PRICES,
    DAY_MULTIPLIERS: LIQUIDATION_DAILY_PRICES, // backwards compatibility
    getTodayDayName,
    calculatePriceForDay,
    ensureProductDailyPrices,
    syncAllDailyPrices
};
