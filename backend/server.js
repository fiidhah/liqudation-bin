const express = require("express");
const dotenv = require("dotenv");

dotenv.config();

// =============================
// Database Connection
// =============================
require("./config/db");

// =============================
// Routes
// =============================
const userRoutes = require("./routes/userRoutes");
const productRoutes = require("./routes/productRoutes");
const managerRoutes = require("./routes/managerRoutes");
const cartRoutes = require("./routes/cartRoutes");
const wishlistRoutes = require("./routes/wishlistRoutes");
const orderRoutes = require("./routes/orderRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();

// =============================
// Middleware
// =============================
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

// Cart Routes
app.use("/api/cart", cartRoutes);

// Wishlist Routes
app.use("/api/wishlist", wishlistRoutes);

// Order Routes
app.use("/api/orders", orderRoutes);

// Admin Routes
app.use("/api/admin", adminRoutes);

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