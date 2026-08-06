const express = require("express");

const router = express.Router();

const {
    getAllUsers,
    registerUser,
    loginUser,
    getUserProfile
} = require("../controllers/userController");

const auth = require("../middleware/auth");

// =============================
// TEST ROUTE
// =============================
router.get("/test", (req, res) => {
    res.send("User Route Working");
});

// =============================
// GET ALL USERS
// =============================
router.get("/", getAllUsers);

// =============================
// REGISTER USER
// =============================
router.post("/register", registerUser);

// =============================
// LOGIN USER
// =============================
router.post("/login", loginUser);

// =============================
// USER PROFILE (Protected)
// =============================
router.get("/profile", auth, getUserProfile);

module.exports = router;