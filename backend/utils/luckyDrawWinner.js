const db = require("../config/db");

/**
 * Randomly picks an eligible winner for a lucky draw.
 * Candidates can be drawn from recent orders or registered users.
 */
const pickRandomWinner = (drawId) => {
    return new Promise((resolve, reject) => {
        // Step 1: Get Lucky Draw details
        const drawSql = "SELECT * FROM lucky_draws WHERE draw_id = ?";
        db.query(drawSql, [drawId], (err, draws) => {
            if (err) return reject(err);
            if (draws.length === 0) return reject(new Error("Lucky draw not found."));

            const draw = draws[0];

            // Step 2: Get all customers with confirmed/delivered orders or registered users
            const eligibleSql = `
                SELECT DISTINCT u.user_id, u.full_name, u.email, u.phone, o.order_id
                FROM users u
                LEFT JOIN orders o ON u.user_id = o.user_id AND o.order_status != 'Cancelled'
                ORDER BY RAND()
                LIMIT 1
            `;

            db.query(eligibleSql, (err, eligibleUsers) => {
                if (err) return reject(err);
                if (eligibleUsers.length === 0) return reject(new Error("No eligible users found for lucky draw."));

                const winner = eligibleUsers[0];

                // Step 3: Insert into lucky_draw_winners
                const insertSql = `
                    INSERT INTO lucky_draw_winners
                    (draw_id, user_id, order_id, prize_won, announced_date)
                    VALUES (?, ?, ?, ?, NOW())
                `;

                db.query(insertSql, [drawId, winner.user_id, winner.order_id || null, draw.prize], (err, insertResult) => {
                    if (err) return reject(err);

                    // Step 4: Mark lucky draw as Completed
                    db.query("UPDATE lucky_draws SET status = 'Completed' WHERE draw_id = ?", [drawId], () => {
                        resolve({
                            winner_id: insertResult.insertId,
                            draw_id: drawId,
                            draw_name: draw.draw_name,
                            prize_won: draw.prize,
                            user: {
                                user_id: winner.user_id,
                                full_name: winner.full_name,
                                email: winner.email,
                                phone: winner.phone
                            }
                        });
                    });
                });
            });
        });
    });
};

module.exports = {
    pickRandomWinner
};
