const db = require("./config/db");

const DAYS = ['Friday', 'Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];

const LIQUIDATION_SCHEDULE = {
    Friday: 999.00,
    Saturday: 799.00,
    Sunday: 599.00,
    Monday: 399.00,
    Tuesday: 299.00,
    Wednesday: 199.00,
    Thursday: 99.00
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
                for (const day of DAYS) {
                    const dayPrice = LIQUIDATION_SCHEDULE[day];
                    await new Promise((res) => {
                        db.query(
                            `INSERT INTO daily_prices (product_id, day_name, price)
                             VALUES (?, ?, ?)
                             ON DUPLICATE KEY UPDATE price = VALUES(price)`,
                            [prod.product_id, day, dayPrice],
                            (insertErr) => {
                                if (!insertErr) insertedCount++;
                                res();
                            }
                        );
                    });
                }
            }

            // Also update current price in products table to match TODAY's day price
            const todayName = getTodayDayName();
            const todayPrice = LIQUIDATION_SCHEDULE[todayName] || 299.00;
            db.query(
                "UPDATE products SET price = ?",
                [todayPrice],
                (uErr, uRes) => {
                    if (uErr) console.error("Update error:", uErr.message);
                    console.log(`✅ Synced products table to ${todayName}'s liquidation price: ₹${todayPrice}`);
                    resolve({ total: products.length, today: todayName, price: todayPrice });
                }
            );
        });
    });
};

syncDailyPrices()
    .then((res) => {
        console.log(`Successfully populated daily price records for ${res.total} products!`);
        process.exit(0);
    })
    .catch((err) => {
        console.error("Error seeding daily prices:", err);
        process.exit(1);
    });
