const db = require("./config/db");

const DAYS = ['Friday', 'Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];

const MULTIPLIERS = {
    Friday: 1.00,    // Restock Day (100%)
    Saturday: 0.80,  // 80%
    Sunday: 0.65,    // 65%
    Monday: 0.50,    // 50%
    Tuesday: 0.35,   // 35%
    Wednesday: 0.25, // 25%
    Thursday: 0.15   // 15% Clearance
};

const getTodayDayName = () => {
    const daysArr = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return daysArr[new Date().getDay()];
};

const syncDailyPrices = () => {
    return new Promise((resolve, reject) => {
        db.query("SELECT product_id, product_name, price FROM products", async (err, products) => {
            if (err) return reject(err);

            console.log(`Found ${products.length} products to check for daily prices.`);
            let insertedCount = 0;

            for (const prod of products) {
                const basePrice = Math.max(10, parseFloat(prod.price) || 100);

                // Fetch existing daily prices for this product
                const existing = await new Promise((res) => {
                    db.query("SELECT day_name FROM daily_prices WHERE product_id = ?", [prod.product_id], (e, rows) => {
                        res((rows || []).map(r => r.day_name));
                    });
                });

                for (const day of DAYS) {
                    if (!existing.includes(day)) {
                        let dayPrice = Math.round(basePrice * (MULTIPLIERS[day] || 1.0));
                        if (dayPrice < 1) dayPrice = 1;

                        await new Promise((res) => {
                            db.query(
                                "INSERT INTO daily_prices (product_id, day_name, price) VALUES (?, ?, ?)",
                                [prod.product_id, day, dayPrice],
                                (insertErr) => {
                                    if (!insertErr) insertedCount++;
                                    res();
                                }
                            );
                        });
                    }
                }
            }

            // Also update current price in products table to match TODAY's day price
            const todayName = getTodayDayName();
            db.query(
                `UPDATE products p 
                 JOIN daily_prices dp ON p.product_id = dp.product_id 
                 SET p.price = dp.price 
                 WHERE dp.day_name = ?`,
                [todayName],
                (upErr, upRes) => {
                    if (upErr) console.error("Error updating products with today's price:", upErr.message);
                    else console.log(`Updated ${upRes.affectedRows} products to today's (${todayName}) liquidated price!`);
                    
                    resolve({ insertedCount, todayName });
                }
            );
        });
    });
};

syncDailyPrices()
    .then((res) => {
        console.log(`Successfully populated ${res.insertedCount} daily price records!`);
        process.exit(0);
    })
    .catch((err) => {
        console.error("Failed to sync daily prices:", err);
        process.exit(1);
    });
