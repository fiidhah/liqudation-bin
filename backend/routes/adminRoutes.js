const express = require("express");

const router = express.Router();

const {
    registerAdmin,
    loginAdmin,
    getDashboard,
    deleteManager,
    updateManager,
    getSalesReport
} = require("../controllers/adminController");

// =============================
// TEST ROUTE
// =============================
router.get("/test", (req, res) => {
    res.send("Admin Route Working");
});

// =============================
// REGISTER ADMIN
// =============================
router.post("/register", registerAdmin);

// =============================
// ADMIN LOGIN
// =============================
router.post("/login", loginAdmin);

// =============================
// ADMIN DASHBOARD
// =============================
router.get("/dashboard", getDashboard);
// =============================
// DELETE MANAGER
// =============================
router.delete("/delete/:id", deleteManager);
// =============================
// UPDATE MANAGER
// =============================
router.put("/update/:id", updateManager);
// =============================
// SALES REPORT
// =============================
router.get("/sales-report", getSalesReport);

module.exports = router;