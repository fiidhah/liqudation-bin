const db = require("../config/db");
const { isValidText, isValidDateRange } = require("../utils/validator");

// =============================
// ADD PROMOTIONAL OFFER (With Validation)
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

    if (!isValidText(title, 2)) {
        return res.status(400).json({
            success: false,
            message: "Offer title is required (minimum 2 characters)."
        });
    }

    const discount = Number(discount_percentage);
    if (isNaN(discount) || discount <= 0 || discount > 100) {
        return res.status(400).json({
            success: false,
            message: "Discount percentage must be a number between 1 and 100."
        });
    }

    if (!start_date || !end_date) {
        return res.status(400).json({
            success: false,
            message: "Both start date and end date are required."
        });
    }

    if (!isValidDateRange(start_date, end_date)) {
        return res.status(400).json({
            success: false,
            message: "Start date cannot be after the end date."
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
            title.trim(),
            description ? description.trim() : "",
            discount,
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
                message: "Promotional coupon offer created successfully.",
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
// VALIDATE COUPON CODE
// =============================
const validateCoupon = (req, res) => {
    const { code, order_amount } = req.body;

    if (!code || typeof code !== 'string') {
        return res.status(400).json({
            success: false,
            message: "Coupon code is required."
        });
    }

    const cleanCode = code.trim().toUpperCase().replace(/\s+/g, "");

    const sql = `
        SELECT *
        FROM promotional_offers
        WHERE UPPER(REPLACE(title, ' ', '')) = ?
        AND (status = 'Active' OR status IS NULL)
        AND (CURDATE() BETWEEN start_date AND end_date OR start_date IS NULL)
        LIMIT 1
    `;

    db.query(sql, [cleanCode], (err, results) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: err.message
            });
        }

        if (results.length === 0) {
            // Check if user entered a standard welcome promo
            if (cleanCode === "WELCOME15" || cleanCode === "BIN10" || cleanCode === "SAVE20") {
                const discount = cleanCode === "SAVE20" ? 20 : (cleanCode === "WELCOME15" ? 15 : 10);
                return res.status(200).json({
                    success: true,
                    message: `Promo code ${cleanCode} applied (-${discount}%)!`,
                    coupon: {
                        code: cleanCode,
                        discount_percentage: discount
                    }
                });
            }

            return res.status(404).json({
                success: false,
                message: "Invalid, expired, or inactive coupon code."
            });
        }

        const offer = results[0];
        res.status(200).json({
            success: true,
            message: `Coupon "${offer.title}" applied! Enjoy ${offer.discount_percentage}% discount.`,
            coupon: {
                offer_id: offer.offer_id,
                title: offer.title,
                code: cleanCode,
                discount_percentage: Number(offer.discount_percentage)
            }
        });
    });
};

// =============================
// UPDATE OFFER
// =============================
const updateOffer = (req, res) => {
    const { id } = req.params;
    const { title, description, discount_percentage, start_date, end_date, status } = req.body;

    const sql = `
        UPDATE promotional_offers
        SET title = COALESCE(?, title),
            description = COALESCE(?, description),
            discount_percentage = COALESCE(?, discount_percentage),
            start_date = COALESCE(?, start_date),
            end_date = COALESCE(?, end_date),
            status = COALESCE(?, status)
        WHERE offer_id = ?
    `;

    db.query(
        sql,
        [title ? title.trim() : null, description ? description.trim() : null, discount_percentage ? Number(discount_percentage) : null, start_date || null, end_date || null, status || null, id],
        (err, result) => {
            if (err) return res.status(500).json({ success: false, message: err.message });
            if (result.affectedRows === 0) return res.status(404).json({ success: false, message: "Offer not found." });
            res.status(200).json({ success: true, message: "Offer updated successfully." });
        }
    );
};

// =============================
// DELETE PROMOTIONAL OFFER
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
            message: "Promotional offer deleted successfully."
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