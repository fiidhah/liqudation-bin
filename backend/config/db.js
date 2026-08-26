const mysql = require("mysql2");
const dotenv = require("dotenv");

dotenv.config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "fidha",
    database: process.env.DB_NAME || "liquidation_bin",
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

pool.getConnection((err, connection) => {
    if (err) {
        console.error("❌ Database Connection Failed:", err.message);
        return;
    }
    console.log(`✅ MySQL Database "${process.env.DB_NAME || 'liquidation_bin'}" Connected Successfully via Pool`);
    connection.release();
});

module.exports = pool;