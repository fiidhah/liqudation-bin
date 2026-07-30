const express = require("express");

const router = express.Router();

const {
    getAllUsers,
    registerUser
} = require("../controllers/userController");

// GET All Users
router.get("/", getAllUsers);
// REGISTER user
router.post("/register", registerUser);
router.get("/test", (req, res) => {
    res.send("User Route Working");
});

module.exports = router;