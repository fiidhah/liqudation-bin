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

// =============================
// TEST ROUTE
// =============================
router.get("/test", (req, res) => {
    res.send("Manager Route Working");
});

// =============================
// GET ALL MANAGERS
// =============================
router.get("/", getAllManagers);

// =============================
// GET MANAGER BY ID
// =============================
router.get("/:id", getManagerById);

// =============================
// REGISTER MANAGER
// =============================
router.post("/register", registerManager);

// =============================
// LOGIN MANAGER
// =============================
router.post("/login", loginManager);

// =============================
// UPDATE MANAGER
// =============================
router.put("/update/:id", updateManager);

// =============================
// MANAGER PROFILE
// =============================
router.get("/profile", getManagerProfile);
// =============================
// DELETE MANAGER
// =============================
router.delete("/delete/:id", deleteManager);

module.exports = router;