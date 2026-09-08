const db = require("../config/db");

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Standard weekly liquidation markdown multipliers starting from Friday (Restock Day) to Thursday (Clearance)
const DAY_MULTIPLIERS = {
    Friday: 1.00,    // 100% (Restock Day - Peak Value)
    Saturday: 0.80,  // 80% (Weekend Rush)
    Sunday: 0.65,    // 65% (Weekend Markdown)
    Monday: 0.50,    // 50% (Markdown Monday)
    Tuesday: 0.35,   // 35% (Value Tuesday)
    Wednesday: 0.25, // 25% (Blowout Wednesday)
    Thursday: 0.15   // 15% (Clearance Day - Lowest Price)
};

const getTodayDayName = () => {
    return DAYS_OF_WEEK[new Date().getDay()];
};

/**
 * Calculates price for a given base price and day name
 */
const calculatePriceForDay = (basePrice, dayName) => {
    const mult = DAY_MULTIPLIERS[dayName] || 1.0;
    const price = Math.round(Number(basePrice) * mult * 100) / 100;
    return Math.max(1, price);
};

/**
 * Ensures a single product has 7 daily prices configured.
 */
const ensureProductDailyPrices = (productId, basePrice) => {
    return new Promise((resolve, reject) => {
        const pId = parseInt(productId);
        const bPrice = Math.max(10, parseFloat(basePrice) || 100);

        db.query("SELECT day_name FROM daily_prices WHERE product_id = ?", [pId], async (err, rows) => {
            if (err) return reject(err);

            const existingDays = (rows || []).map(r => r.day_name);
            const daysToInsert = ['Friday', 'Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];

            for (const day of daysToInsert) {
                if (!existingDays.includes(day)) {
                    const dayPrice = calculatePriceForDay(bPrice, day);
                    await new Promise((res) => {
                        db.query(
                            "INSERT INTO daily_prices (product_id, day_name, price) VALUES (?, ?, ?)",
                            [pId, day, dayPrice],
                            () => res()
                        );
                    });
                }
            }
            resolve(true);
        });
    });
};

/**
 * Ensures every product in database has all 7 daily prices populated,
 * and updates products.price to TODAY's exact liquidated price.
 */
const syncAllDailyPrices = () => {
    return new Promise((resolve, reject) => {
        db.query("SELECT product_id, product_name, price FROM products", async (err, products) => {
            if (err) return reject(err);

            for (const p of products) {
                await ensureProductDailyPrices(p.product_id, p.price);
            }

            const todayName = getTodayDayName();
            db.query(
                `UPDATE products p
                 JOIN daily_prices dp ON p.product_id = dp.product_id
                 SET p.price = dp.price
                 WHERE dp.day_name = ?`,
                [todayName],
                (upErr, upRes) => {
                    if (upErr) console.error("Error updating today's prices:", upErr.message);
                    resolve({
                        success: true,
                        today: todayName,
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
    DAY_MULTIPLIERS,
    getTodayDayName,
    calculatePriceForDay,
    ensureProductDailyPrices,
    syncAllDailyPrices
};
