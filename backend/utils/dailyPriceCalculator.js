const db = require("../config/db");

/**
 * Calculates current liquidation price according to the day-of-the-week schedule.
 */
const getTodayPriceSchedule = () => {
    return new Promise((resolve, reject) => {
        const todayDayOfWeek = new Date().getDay(); // 0 = Sun, 1 = Mon ...
        const sql = "SELECT * FROM daily_price_schedule WHERE day_of_week = ?";
        
        db.query(sql, [todayDayOfWeek], (err, result) => {
            if (err) return reject(err);
            if (result.length > 0) {
                resolve(result[0]);
            } else {
                resolve({ day_of_week: todayDayOfWeek, price: 10.00, day_name: "Today", description: "Standard Liquidation Price" });
            }
        });
    });
};

module.exports = {
    getTodayPriceSchedule
};
