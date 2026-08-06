const express = require("express");

const router = express.Router();

const {
    addToWishlist
} = require("../controllers/wishlistController");

// =============================
// TEST ROUTE
// =============================
router.get("/test", (req, res) => {
    res.send("Wishlist Route Working");
});

// =============================
// ADD TO WISHLIST
// =============================
router.post("/add", addToWishlist);

module.exports = router;