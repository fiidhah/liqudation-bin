const express = require("express");
const router = express.Router();

const {
    makePayment,
    getPaymentByOrderId
} = require("../controllers/paymentController");

// Process simulated payment
router.post("/process", makePayment);

// Legacy/Dummy Payment endpoint
router.post("/dummy-payment", makePayment);

// Get Payment Details by Order ID
router.get("/order/:order_id", getPaymentByOrderId);

module.exports = router;
