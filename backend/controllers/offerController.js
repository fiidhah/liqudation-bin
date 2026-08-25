const db = require("../config/db");

// =============================
// ADD OFFER
// =============================
const addOffer = (req, res) => {

    const {
        title,
        description,
        discount_percentage,
        start_date,
        end_date,
        status
    } = req.body;

    if (!title || !start_date || !end_date) {
        return res.status(400).json({
            success: false,
            message: "Title, start date and end date are required."
        });
    }

    const sql = `
        INSERT INTO promotional_offers
        (
            title,
            description,
            discount_percentage,
            start_date,
            end_date,
            status
        )
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    db.query(
        sql,
        [
            title,
            description,
            discount_percentage || 0,
            start_date,
            end_date,
            status || "Active"
        ],
        (err, result) => {

            if (err) {
                return res.status(500).json({
                    success: false,
                    message: err.message
                });
            }

            res.status(201).json({
                success: true,
                message: "Offer added successfully.",
                offerId: result.insertId
            });

        }
    );

};


// =============================
// GET ALL OFFERS
// =============================
const getAllOffers = (req, res) => {

    const sql = `
        SELECT *
        FROM promotional_offers
        ORDER BY created_at DESC
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
            totalOffers: result.length,
            data: result
        });

    });

};


// =============================
// UPDATE OFFER
// =============================
const updateOffer = (req, res) => {

    const { id } = req.params;

    const {
        title,
        description,
        discount_percentage,
        start_date,
        end_date,
        status
    } = req.body;

    const sql = `
        UPDATE promotional_offers
        SET
            title = ?,
            description = ?,
            discount_percentage = ?,
            start_date = ?,
            end_date = ?,
            status = ?
        WHERE offer_id = ?
    `;

    db.query(
        sql,
        [
            title,
            description,
            discount_percentage,
            start_date,
            end_date,
            status,
            id
        ],
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
                    message: "Offer not found."
                });
            }

            res.status(200).json({
                success: true,
                message: "Offer updated successfully."
            });

        }
    );

};


// =============================
// DELETE OFFER
// =============================
const deleteOffer = (req, res) => {

    const { id } = req.params;

    const sql = `
        DELETE FROM promotional_offers
        WHERE offer_id = ?
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
                message: "Offer not found."
            });
        }

        res.status(200).json({
            success: true,
            message: "Offer deleted successfully."
        });

    });

};


module.exports = {
    addOffer,
    getAllOffers,
    updateOffer,
    deleteOffer
};