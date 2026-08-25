const db = require("../config/db");

// =============================
// CREATE LUCKY DRAW
// =============================
const createLuckyDraw = (req, res) => {

    const {
        draw_name,
        draw_date,
        description
    } = req.body;

    if (!draw_name || !draw_date) {
        return res.status(400).json({
            success: false,
            message: "Draw name and draw date are required."
        });
    }

    const sql = `
        INSERT INTO lucky_draws
        (draw_name, draw_date, description)
        VALUES (?, ?, ?)
    `;

    db.query(
        sql,
        [draw_name, draw_date, description],
        (err, result) => {

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

        }
    );
};


// =============================
// GET ALL LUCKY DRAWS
// =============================
const getAllLuckyDraws = (req, res) => {

    const sql = `
        SELECT *
        FROM lucky_draws
        ORDER BY draw_date DESC
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

    const {
        draw_name,
        draw_date,
        description
    } = req.body;

    const sql = `
        UPDATE lucky_draws
        SET
            draw_name = ?,
            draw_date = ?,
            description = ?
        WHERE draw_id = ?
    `;

    db.query(
        sql,
        [draw_name, draw_date, description, id],
        (err, result) => {

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

        }
    );
};


// =============================
// DELETE LUCKY DRAW
// =============================
const deleteLuckyDraw = (req, res) => {

    const { id } = req.params;

    const sql = `
        DELETE FROM lucky_draws
        WHERE draw_id = ?
    `;

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


module.exports = {
    createLuckyDraw,
    getAllLuckyDraws,
    updateLuckyDraw,
    deleteLuckyDraw
};