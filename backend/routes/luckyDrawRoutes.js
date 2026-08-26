const express = require("express");
const router = express.Router();

const {
    createLuckyDraw,
    getAllLuckyDraws,
    updateLuckyDraw,
    deleteLuckyDraw,
    pickWinner,
    getAllWinners
} = require("../controllers/luckyDrawController");

// Test Route
router.get("/test", (req, res) => {
    res.send("Lucky Draw Route Working");
});

// GET ALL WINNERS (Must be before /:id)
router.get("/winners/all", getAllWinners);

// GET ALL LUCKY DRAWS
router.get("/", getAllLuckyDraws);

// CREATE LUCKY DRAW
router.post("/add", createLuckyDraw);

// PICK RANDOM WINNER
router.post("/pick-winner/:id", pickWinner);

// UPDATE LUCKY DRAW
router.put("/update/:id", updateLuckyDraw);

// DELETE LUCKY DRAW
router.delete("/delete/:id", deleteLuckyDraw);

module.exports = router;