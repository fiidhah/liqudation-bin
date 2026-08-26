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
            message: "Title, start date, and end date are required."
        });
    }

    const sql = `
        INSERT INTO promotional_offers
        (title, description, discount_percentage, start_date, end_date, status)
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    db.query(
        sql,
        [
            title,
            description || "",
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
                message: "Promotional offer created successfully.",
                offerId: result.insertId
            });
        }
    );
};

// =============================
// GET ALL OFFERS
// =============================
const getAllOffers = (req, res) => {
    const sql = "SELECT * FROM promotional_offers ORDER BY offer_id DESC";

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
// GET ACTIVE OFFERS (Customer)
// =============================
const getActiveOffers = (req, res) => {
    const sql = `
        SELECT *
        FROM promotional_offers
        WHERE (status = 'Active' OR status IS NULL)
        AND (CURDATE() BETWEEN start_date AND end_date OR start_date IS NULL)
        ORDER BY discount_percentage DESC
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
// VALIDATE OFFER / COUPON
// =============================
const validateCoupon = (req, res) => {
    const { code, title, order_amount } = req.body;
    const searchParam = code || title;

    if (!searchParam) {
        return res.status(400).json({
            success: false,
            message: "Coupon code or title is required."
        });
    }

    const sql = `
        SELECT *
        FROM promotional_offers
        WHERE (title LIKE ? OR description LIKE ?)
        AND (status = 'Active' OR status IS NULL)
    `;

    const searchVal = `%${searchParam}%`;

    db.query(sql, [searchVal, searchVal], (err, result) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: err.message
            });
        }

        if (result.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Invalid or expired promotional offer."
            });
        }

        const offer = result[0];
        const currentOrderAmount = Number(order_amount) || 0;
        const discountPercent = Number(offer.discount_percentage) || 10;
        const discountValue = (currentOrderAmount * discountPercent) / 100;

        res.status(200).json({
            success: true,
            message: `Offer "${offer.title}" applied! Saved ${discountPercent}% ($${discountValue.toFixed(2)}).`,
            coupon: {
                offer_id: offer.offer_id,
                title: offer.title,
                code: searchParam.toUpperCase(),
                discount_percentage: discountPercent,
                discount_amount: parseFloat(discountValue.toFixed(2)),
                final_amount: parseFloat((currentOrderAmount - discountValue).toFixed(2))
            }
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
            title = COALESCE(?, title),
            description = COALESCE(?, description),
            discount_percentage = COALESCE(?, discount_percentage),
            start_date = COALESCE(?, start_date),
            end_date = COALESCE(?, end_date),
            status = COALESCE(?, status)
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

    const sql = "DELETE FROM promotional_offers WHERE offer_id = ?";

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
    getActiveOffers,
    validateCoupon,
    updateOffer,
    deleteOffer
};