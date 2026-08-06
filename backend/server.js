const express = require("express");
const dotenv = require("dotenv");

dotenv.config();

// Database Connection
require("./config/db");

// Routes
const userRoutes = require("./routes/userRoutes");
const productRoutes = require("./routes/productRoutes");
const managerRoutes = require("./routes/managerRoutes");
const cartRoutes = require("./routes/cartRoutes");
const app = express();

// Middleware
app.use(express.json());

// =============================
// Register Routes
// =============================

// User Routes
app.use("/api/users", userRoutes);

// Product Routes
app.use("/api/products", productRoutes);

// Manager Routes
app.use("/api/managers", managerRoutes);
app.use("/api/cart", cartRoutes);

// =============================
// Home Route
// =============================
app.get("/", (req, res) => {
    res.send("Welcome to Smart Liquidation Bin Store API");
});

// =============================
// Start Server
// =============================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});