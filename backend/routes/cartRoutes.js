const express = require("express");

const router = express.Router();

const {
    addToCart
} = require("../controllers/cartController");

// =============================
// TEST ROUTE
// =============================
router.get("/test", (req, res) => {
    res.send("Cart Route Working");
});

// =============================
// ADD TO CART
// =============================
router.post("/add", addToCart);

module.exports = router;