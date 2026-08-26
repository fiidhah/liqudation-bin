const express = require("express");
const router = express.Router();

const {
    addOffer,
    getAllOffers,
    getActiveOffers,
    validateCoupon,
    updateOffer,
    deleteOffer
} = require("../controllers/offerController");

// Test Route
router.get("/test", (req, res) => {
    res.send("Offer Route Working");
});

// GET ACTIVE OFFERS (Customer)
router.get("/active", getActiveOffers);

// VALIDATE COUPON CODE
router.post("/validate", validateCoupon);

// GET ALL OFFERS (Admin / Manager)
router.get("/", getAllOffers);

// ADD OFFER
router.post("/add", addOffer);

// UPDATE OFFER
router.put("/update/:id", updateOffer);

// DELETE OFFER
router.delete("/delete/:id", deleteOffer);

module.exports = router;