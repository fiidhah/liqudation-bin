const express = require("express");

const router = express.Router();

const {
    placeOrder,
    getUserOrders,
    getAllOrders,
    updateOrderStatus,
    cancelOrder,
    getOrderDetails
} = require("../controllers/orderController");

// =============================
// TEST ROUTE
// =============================
router.get("/test", (req, res) => {
    res.send("Order Route Working");
});

// =============================
// PLACE ORDER
// =============================
router.post("/place", placeOrder);
// =============================
// GET USER ORDERS
// =============================
router.get("/user/:user_id", getUserOrders);
// =============================
// GET ALL ORDERS
// =============================
router.get("/all", getAllOrders);
// =============================
// UPDATE ORDER STATUS
// =============================
router.put("/update-status/:id", updateOrderStatus);
// =============================
// CANCEL ORDER
// =============================
router.put("/cancel/:id", cancelOrder);
// =============================
// GET ORDER DETAILS
// =============================
router.get("/:id", getOrderDetails);

module.exports = router;