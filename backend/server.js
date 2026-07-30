const express = require("express");
const dotenv = require("dotenv");

dotenv.config();

require("./config/db");

const userRoutes = require("./routes/userRoutes");

const app = express();

app.use(express.json());

// Register User Routes
app.use("/api/users", userRoutes);

const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
    res.send("Welcome to Smart Liquidation Bin Store API");
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});