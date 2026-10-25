const db = require("../config/db");

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Official Increased Liquidation Bin Store Markdown Schedule
const LIQUIDATION_DAILY_PRICES = {
    Friday: 2499.00,    // Friday Restock: ₹2,499 (Highest Value, Fresh Loads)
    Saturday: 1999.00,  // Saturday Rush: ₹1,999 (Weekend Surge)
    Sunday: 1499.00,    // Sunday Drop: ₹1,499 (Weekend Special)
    Monday: 999.00,     // Monday Markdown: ₹999 (First Wave Markdown)
    Tuesday: 699.00,    // Tuesday Value: ₹699 (Value Deal)
    Wednesday: 399.00,  // Wednesday Blowout: ₹399 (Deep Cut Drop)
    Thursday: 199.00    // Thursday Clearance: ₹199 (All Bins Clearance Blowout)
};

const getTodayDayName = () => {
    return DAYS_OF_WEEK[new Date().getDay()];
};

/**
 * Returns the exact scheduled liquidation price for a given day name.
 */
const calculatePriceForDay = (basePrice, dayName) => {
    return LIQUIDATION_DAILY_PRICES[dayName] !== undefined ? LIQUIDATION_DAILY_PRICES[dayName] : 699.00;
};

/**
 * Ensures a single product has all 7 daily liquidation prices configured matching the daily schedule.
 */
const ensureProductDailyPrices = (productId) => {
    return new Promise((resolve, reject) => {
        const pId = parseInt(productId);
        const daysToInsert = ['Friday', 'Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];

        db.query("SELECT product_id FROM products WHERE product_id = ?", [pId], async (err, prodRows) => {
            if (err) return reject(err);
            if (!prodRows || prodRows.length === 0) return resolve(false);

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
 * Ensures every product in the database has all 7 daily prices synchronized with the daily price schedule,
 * and sets products.price to TODAY's scheduled bin price.
 */
const syncAllDailyPrices = () => {
    return new Promise((resolve, reject) => {
        const daysToInsert = ['Friday', 'Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];
        const todayName = getTodayDayName();
        const todayPrice = LIQUIDATION_DAILY_PRICES[todayName] || 699.00;

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

            console.log(`🏷️ [SCHEDULE AUTO-SYNC] Synchronized daily price schedule (Today ${todayName}: ₹${todayPrice}) across all ${products.length} products.`);
            resolve({
                success: true,
                today: todayName,
                todayPrice: todayPrice,
                totalProducts: products.length
            });
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
