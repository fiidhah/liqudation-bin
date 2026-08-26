const express = require("express");
const router = express.Router();

const {
    addToCart,
    viewCart,
    updateCart,
    deleteCartItem,
    clearCart
} = require("../controllers/cartController");

// Test Route
router.get("/test", (req, res) => {
    res.send("Cart Route Working");
});

// ADD TO CART
router.post("/add", addToCart);

// VIEW CART
router.get("/:user_id", viewCart);

// UPDATE CART
router.put("/update/:id", updateCart);

// DELETE CART ITEM
router.delete("/delete/:id", deleteCartItem);

// CLEAR CART
router.delete("/clear/:user_id", clearCart);

module.exports = router;