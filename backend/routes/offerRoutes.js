const express = require("express");

const router = express.Router();

const {
    addOffer,
    getAllOffers,
    updateOffer,
    deleteOffer
} = require("../controllers/offerController");

// =============================
// TEST ROUTE
// =============================
router.get("/test", (req, res) => {
    res.send("Offer Route Working");
});

// =============================
// ADD OFFER
// =============================
router.post("/add", addOffer);

// =============================
// GET ALL OFFERS
// =============================
router.get("/", getAllOffers);

// =============================
// UPDATE OFFER
// =============================
router.put("/update/:id", updateOffer);

// =============================
// DELETE OFFER
// =============================
router.delete("/delete/:id", deleteOffer);

module.exports = router;