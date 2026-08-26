const express = require("express");
const router = express.Router();

const {
    getAllDailyPrices,
    getTodayPrices,
    addDailyPrice,
    updateDailyPrice,
    deleteDailyPrice,
    applyTodayPrices
} = require("../controllers/dailyPriceController");

// Get all daily price configurations
router.get("/", getAllDailyPrices);

// Get today's active price overrides
router.get("/today", getTodayPrices);

// Add a daily price configuration for a product
router.post("/add", addDailyPrice);

// Update a daily price entry
router.put("/update/:id", updateDailyPrice);

// Delete a daily price entry
router.delete("/delete/:id", deleteDailyPrice);

// Trigger bulk apply of today's prices to products
router.post("/apply-today", applyTodayPrices);

module.exports = router;
