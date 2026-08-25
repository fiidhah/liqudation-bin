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
const offerRoutes = require("./routes/offerRoutes");
const luckyDrawRoutes = require("./routes/luckyDrawRoutes");

// =============================
// Check Route Imports
// =============================
console.log("User Routes:", typeof userRoutes);
console.log("Product Routes:", typeof productRoutes);
console.log("Manager Routes:", typeof managerRoutes);
console.log("Cart Routes:", typeof cartRoutes);
console.log("Wishlist Routes:", typeof wishlistRoutes);
console.log("Order Routes:", typeof orderRoutes);
console.log("Admin Routes:", typeof adminRoutes);
console.log("Offer Routes:", typeof offerRoutes);
console.log("Lucky Draw Routes:", typeof luckyDrawRoutes);

// =============================
// Create Express App
// =============================
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

// Offer Routes
app.use("/api/offers", offerRoutes);

// Lucky Draw Routes
app.use("/api/lucky-draws", luckyDrawRoutes);

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