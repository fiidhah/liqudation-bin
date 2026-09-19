const express = require("express");
const path = require("path");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

// =============================
// Database Auto-Initialization
// =============================
const initDb = require("./config/initDb");
const db = require("./config/db");
const { syncAllDailyPrices, getTodayDayName } = require("./utils/dailyPriceCalculator");

// Run Auto-Init and initial price sync
initDb().then(async () => {
    console.log("🚀 Database tables and default records verified.");
    await syncAllDailyPrices();
}).catch((err) => {
    console.error("⚠️ Database initialization warning:", err.message);
});

// =============================
// Automated Daily Price Rollover (Midnight Auto-Sync)
// =============================
let lastTrackedDay = getTodayDayName();
setInterval(async () => {
    const currentDay = getTodayDayName();
    if (currentDay !== lastTrackedDay) {
        console.log(`🌙 [MIDNIGHT ROLLOVER] Day transitioned from ${lastTrackedDay} to ${currentDay}! Automatically updating all product prices...`);
        lastTrackedDay = currentDay;
        try {
            await syncAllDailyPrices();
        } catch (err) {
            console.error("❌ Error during daily price rollover:", err.message);
        }
    }
}, 60 * 1000); // Automatically checks every 60 seconds

// =============================
// Routes Imports
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
const dailyPriceRoutes = require("./routes/dailyPriceRoutes");
const paymentRoutes = require("./routes/paymentRoutes");

// =============================
// Create Express App
// =============================
const app = express();

// =============================
// Middleware
// =============================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve Uploaded Files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Serve Static Frontend Web App
app.use(express.static(path.join(__dirname, "public")));

// =============================
// Register API Routes
// =============================
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/managers", managerRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/offers", offerRoutes);
app.use("/api/lucky-draws", luckyDrawRoutes);
app.use("/api/daily-prices", dailyPriceRoutes);
app.use("/api/payments", paymentRoutes);

// Newsletter Subscription API
app.post("/api/newsletter/subscribe", async (req, res) => {
    try {
        const { email } = req.body;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email)) {
            return res.status(400).json({ success: false, message: "Please provide a valid email address." });
        }

        const cleanEmail = email.trim().toLowerCase();
        try {
            await db.promise().query("INSERT IGNORE INTO subscribers (email) VALUES (?)", [cleanEmail]);
        } catch (dbErr) {
            console.warn("Subscriber DB insertion notice:", dbErr.message);
        }

        return res.status(200).json({
            success: true,
            message: "Successfully subscribed to Friday restock alerts!",
            email: cleanEmail
        });
    } catch (err) {
        console.error("Newsletter error:", err);
        return res.status(500).json({ success: false, message: err.message || "Failed to subscribe." });
    }
});

// =============================
// Fallback for HTML Pages
// =============================
app.get("/admin", (req, res) => {
    res.sendFile(path.join(__dirname, "public/admin/index.html"));
});

app.get("/manager", (req, res) => {
    res.sendFile(path.join(__dirname, "public/manager/index.html"));
});

// Health check API
app.get("/api/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "SmartBin Liquidation Store API is running smoothly.",
        timestamp: new Date()
    });
});

// =============================
// Start Server
// =============================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🛍️  SMARTBIN - LIQUIDATION BIN STORE E-COMMERCE`);
    console.log(`🌐 Server running at: http://localhost:${PORT}`);
    console.log(`🛒 Storefront:       http://localhost:${PORT}`);
    console.log(`🏢 Manager Portal:   http://localhost:${PORT}/manager/index.html`);
    console.log(`👑 Admin Dashboard:  http://localhost:${PORT}/admin/index.html`);
    console.log(`====================================================`);
});