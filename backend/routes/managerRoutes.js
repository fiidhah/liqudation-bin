const express = require("express");
const router = express.Router();

const {
    getAllManagers,
    registerManager,
    loginManager,
    getManagerProfile,
    getManagerById,
    updateManager,
    deleteManager
} = require("../controllers/managerController");

// Test Route
router.get("/test", (req, res) => {
    res.send("Manager Route Working");
});

// GET ALL MANAGERS
router.get("/", getAllManagers);

// MANAGER PROFILE (Must be before /:id)
router.get("/profile", getManagerProfile);

// GET MANAGER BY ID
router.get("/:id", getManagerById);

// REGISTER MANAGER
router.post("/register", registerManager);

// LOGIN MANAGER
router.post("/login", loginManager);

// UPDATE MANAGER
router.put("/update/:id", updateManager);

// DELETE MANAGER
router.delete("/delete/:id", deleteManager);

module.exports = router;