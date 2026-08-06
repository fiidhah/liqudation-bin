const express = require("express");

const router = express.Router();

const {
    addToWishlist,
    viewWishlist,
    deleteWishlistItem
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
// =============================
// VIEW WISHLIST
// =============================
router.get("/:user_id", viewWishlist);
// =============================
// DELETE WISHLIST ITEM
// =============================
router.delete("/delete/:id", deleteWishlistItem);

module.exports = router;