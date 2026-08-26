const db = require("../config/db");

// =============================
// CREATE LUCKY DRAW
// =============================
const createLuckyDraw = (req, res) => {
    const { draw_name, draw_date, description } = req.body;

    if (!draw_name || !draw_date) {
        return res.status(400).json({
            success: false,
            message: "Draw name and draw date are required."
        });
    }

    const sql = "INSERT INTO lucky_draws (draw_name, draw_date, description) VALUES (?, ?, ?)";

    db.query(sql, [draw_name, draw_date, description || ""], (err, result) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: err.message
            });
        }

        res.status(201).json({
            success: true,
            message: "Lucky draw created successfully.",
            drawId: result.insertId
        });
    });
};

// =============================
// GET ALL LUCKY DRAWS
// =============================
const getAllLuckyDraws = (req, res) => {
    const sql = `
        SELECT 
            ld.*,
            w.winner_id,
            u.full_name as winner_name,
            u.email as winner_email,
            w.announced_at
        FROM lucky_draws ld
        LEFT JOIN winners w ON ld.draw_id = w.draw_id
        LEFT JOIN users u ON w.user_id = u.user_id
        ORDER BY ld.draw_date DESC
    `;

    db.query(sql, (err, result) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: err.message
            });
        }

        res.status(200).json({
            success: true,
            totalDraws: result.length,
            data: result
        });
    });
};

// =============================
// UPDATE LUCKY DRAW
// =============================
const updateLuckyDraw = (req, res) => {
    const { id } = req.params;
    const { draw_name, draw_date, description } = req.body;

    const sql = `
        UPDATE lucky_draws
        SET
            draw_name = COALESCE(?, draw_name),
            draw_date = COALESCE(?, draw_date),
            description = COALESCE(?, description)
        WHERE draw_id = ?
    `;

    db.query(sql, [draw_name, draw_date, description, id], (err, result) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: err.message
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Lucky draw not found."
            });
        }

        res.status(200).json({
            success: true,
            message: "Lucky draw updated successfully."
        });
    });
};

// =============================
// DELETE LUCKY DRAW
// =============================
const deleteLuckyDraw = (req, res) => {
    const { id } = req.params;

    const sql = "DELETE FROM lucky_draws WHERE draw_id = ?";

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
                message: "Lucky draw not found."
            });
        }

        res.status(200).json({
            success: true,
            message: "Lucky draw deleted successfully."
        });
    });
};

// =============================
// PICK RANDOM WINNER
// =============================
const pickWinner = (req, res) => {
    const { id } = req.params; // draw_id

    // Check if draw exists
    const checkDrawSql = "SELECT * FROM lucky_draws WHERE draw_id = ?";
    db.query(checkDrawSql, [id], (err, draws) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        if (draws.length === 0) return res.status(404).json({ success: false, message: "Lucky draw not found." });

        const draw = draws[0];

        // Pick random user
        const selectUserSql = "SELECT user_id, full_name, email, phone FROM users ORDER BY RAND() LIMIT 1";
        db.query(selectUserSql, (err, users) => {
            if (err) return res.status(500).json({ success: false, message: err.message });
            if (users.length === 0) return res.status(400).json({ success: false, message: "No registered users to select from." });

            const winnerUser = users[0];

            // Insert into winners table
            const insertWinnerSql = "INSERT INTO winners (draw_id, user_id, announced_at) VALUES (?, ?, NOW())";
            db.query(insertWinnerSql, [id, winnerUser.user_id], (err, winnerRes) => {
                if (err) return res.status(500).json({ success: false, message: err.message });

                res.status(200).json({
                    success: true,
                    message: `🎉 Winner selected: ${winnerUser.full_name}!`,
                    winner: {
                        winner_id: winnerRes.insertId,
                        draw_id: id,
                        draw_name: draw.draw_name,
                        user: winnerUser
                    }
                });
            });
        });
    });
};

// =============================
// GET ALL WINNERS
// =============================
const getAllWinners = (req, res) => {
    const sql = `
        SELECT 
            w.winner_id,
            w.draw_id,
            w.user_id,
            w.announced_at,
            u.full_name,
            u.email,
            u.phone,
            ld.draw_name,
            ld.draw_date,
            ld.description as draw_description
        FROM winners w
        JOIN users u ON w.user_id = u.user_id
        JOIN lucky_draws ld ON w.draw_id = ld.draw_id
        ORDER BY w.announced_at DESC
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
            totalWinners: results.length,
            data: results
        });
    });
};

module.exports = {
    createLuckyDraw,
    getAllLuckyDraws,
    updateLuckyDraw,
    deleteLuckyDraw,
    pickWinner,
    getAllWinners
};