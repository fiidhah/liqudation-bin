const express = require("express");

const router = express.Router();

const {
    createLuckyDraw,
    getAllLuckyDraws,
    updateLuckyDraw,
    deleteLuckyDraw
} = require("../controllers/luckyDrawController");

// =============================
// TEST ROUTE
// =============================
router.get("/test", (req, res) => {
    res.send("Lucky Draw Route Working");
});

// =============================
// CREATE LUCKY DRAW
// =============================
router.post("/add", createLuckyDraw);

// =============================
// GET ALL LUCKY DRAWS
// =============================
router.get("/", getAllLuckyDraws);

// =============================
// UPDATE LUCKY DRAW
// =============================
router.put("/update/:id", updateLuckyDraw);

// =============================
// DELETE LUCKY DRAW
// =============================
router.delete("/delete/:id", deleteLuckyDraw);

module.exports = router;