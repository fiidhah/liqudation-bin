const mysql = require("mysql2/promise");
const bcrypt = require("bcrypt");
const dotenv = require("dotenv");

dotenv.config();

const initDb = async () => {
    const config = {
        host: process.env.DB_HOST || "localhost",
        user: process.env.DB_USER || "root",
        password: process.env.DB_PASSWORD || "fidha",
        port: process.env.DB_PORT || 3306
    };

    let connection;
    try {
        connection = await mysql.createConnection(config);
        const dbName = process.env.DB_NAME || "liquidation_bin";
        console.log(`🔄 Checking MySQL Database "${dbName}"...`);

        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
        await connection.query(`USE \`${dbName}\`;`);

        // 1. Admins Table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS admins (
                admin_id INT AUTO_INCREMENT PRIMARY KEY,
                full_name VARCHAR(100) NOT NULL,
                email VARCHAR(100) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                phone VARCHAR(15) NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 2. Managers Table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS managers (
                manager_id INT AUTO_INCREMENT PRIMARY KEY,
                full_name VARCHAR(100) NOT NULL,
                email VARCHAR(100) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                phone VARCHAR(15) NULL,
                address TEXT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 3. Users Table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS users (
                user_id INT AUTO_INCREMENT PRIMARY KEY,
                full_name VARCHAR(100) NOT NULL,
                email VARCHAR(100) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                phone VARCHAR(15) NULL,
                address TEXT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 4. Products Table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS products (
                product_id INT AUTO_INCREMENT PRIMARY KEY,
                manager_id INT NULL,
                product_name VARCHAR(200) NOT NULL,
                description TEXT NULL,
                category VARCHAR(100) NULL,
                brand VARCHAR(100) NULL,
                price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
                quantity INT NULL DEFAULT 0,
                image VARCHAR(255) NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 5. Daily Prices Table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS daily_prices (
                price_id INT AUTO_INCREMENT PRIMARY KEY,
                product_id INT NOT NULL,
                day_name ENUM('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday') NOT NULL,
                price DECIMAL(10, 2) NOT NULL,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY unique_product_day (product_id, day_name)
            );
        `);

        // 6. Cart Table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS cart (
                cart_id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                product_id INT NOT NULL,
                quantity INT NOT NULL DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 7. Cart Items Table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS cart_items (
                cart_item_id INT AUTO_INCREMENT PRIMARY KEY,
                cart_id INT NOT NULL,
                product_id INT NOT NULL,
                quantity INT NULL DEFAULT 1
            );
        `);

        // 8. Wishlist Table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS wishlist (
                wishlist_id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                product_id INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 9. Orders Table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS orders (
                order_id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                total_amount DECIMAL(10, 2) NULL,
                order_status VARCHAR(50) NULL DEFAULT 'Pending',
                order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 10. Order Items Table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS order_items (
                order_item_id INT AUTO_INCREMENT PRIMARY KEY,
                order_id INT NOT NULL,
                product_id INT NOT NULL,
                quantity INT NULL,
                price DECIMAL(10, 2) NULL
            );
        `);

        // 11. Payments Table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS payments (
                payment_id INT AUTO_INCREMENT PRIMARY KEY,
                order_id INT NOT NULL,
                user_id INT NOT NULL,
                razorpay_order_id VARCHAR(255) NULL,
                razorpay_payment_id VARCHAR(255) NULL,
                payment_status VARCHAR(50) NULL DEFAULT 'Pending',
                amount DECIMAL(10, 2) NOT NULL,
                payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 12. Offers Table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS offers (
                offer_id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(150) NULL,
                description TEXT NULL,
                discount_percentage DECIMAL(5, 2) NULL,
                start_date DATE NULL,
                end_date DATE NULL
            );
        `);

        // 13. Promotional Offers Table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS promotional_offers (
                offer_id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(200) NOT NULL,
                description TEXT NULL,
                discount_percentage DECIMAL(5, 2) NULL,
                start_date DATE NOT NULL,
                end_date DATE NOT NULL,
                status VARCHAR(50) NULL DEFAULT 'Active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 14. Lucky Draws Table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS lucky_draws (
                draw_id INT AUTO_INCREMENT PRIMARY KEY,
                draw_name VARCHAR(150) NULL,
                draw_date DATE NULL,
                description TEXT NULL
            );
        `);

        // 15. Winners Table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS winners (
                winner_id INT AUTO_INCREMENT PRIMARY KEY,
                draw_id INT NOT NULL,
                user_id INT NOT NULL,
                announced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 16. Newsletter Subscribers Table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS subscribers (
                subscriber_id INT AUTO_INCREMENT PRIMARY KEY,
                email VARCHAR(150) NOT NULL UNIQUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Seed default records only if missing
        const [adminRows] = await connection.query("SELECT COUNT(*) as count FROM admins");
        if (adminRows[0].count === 0) {
            const adminPass = await bcrypt.hash("admin123", 10);
            await connection.query(
                "INSERT INTO admins (full_name, email, password) VALUES (?, ?, ?)",
                ["Admin Fidha", "admin@gmail.com", adminPass]
            );
        }

        const [mgrRows] = await connection.query("SELECT COUNT(*) as count FROM managers");
        if (mgrRows[0].count === 0) {
            const mgrPass = await bcrypt.hash("manager123", 10);
            await connection.query(
                "INSERT INTO managers (full_name, email, password, phone, address) VALUES (?, ?, ?, ?, ?)",
                ["Store Manager", "manager@gmail.com", mgrPass, "9876543210", "Main Store"]
            );
        }

        const [userRows] = await connection.query("SELECT COUNT(*) as count FROM users");
        if (userRows[0].count === 0) {
            const userPass = await bcrypt.hash("user123", 10);
            await connection.query(
                "INSERT INTO users (full_name, email, password, phone, address) VALUES (?, ?, ?, ?, ?)",
                ["Fidha Rahman", "fidha@gmail.com", userPass, "9876543210", "Malappuram"]
            );
        }

        // Configure and sync increased liquidation markdown schedule for all products
        const [prods] = await connection.query("SELECT product_id FROM products");
        const liquidationSchedule = {
            Friday: 2499.00,
            Saturday: 1999.00,
            Sunday: 1499.00,
            Monday: 999.00,
            Tuesday: 699.00,
            Wednesday: 399.00,
            Thursday: 199.00
        };
        const daysToInsert = ['Friday', 'Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];

        for (const p of prods) {
            for (const d of daysToInsert) {
                const dPrice = liquidationSchedule[d];
                await connection.query(
                    `INSERT INTO daily_prices (product_id, day_name, price)
                     VALUES (?, ?, ?)
                     ON DUPLICATE KEY UPDATE price = VALUES(price)`,
                    [p.product_id, d, dPrice]
                );
            }
        }

        const daysArr = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const todayDayName = daysArr[new Date().getDay()];
        const todayScheduledPrice = liquidationSchedule[todayDayName] || 699.00;

        console.log(`🏷️ Synced daily pricing schedule (Today ${todayDayName}: ₹${todayScheduledPrice}) across all ${prods.length} products.`);

        // Ensure cascading foreign keys on all child tables referencing products
        try {
            const [fks] = await connection.query(`
                SELECT 
                    k.TABLE_NAME, 
                    k.CONSTRAINT_NAME, 
                    rc.DELETE_RULE
                FROM 
                    INFORMATION_SCHEMA.KEY_COLUMN_USAGE k
                JOIN 
                    INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS rc 
                    ON k.CONSTRAINT_NAME = rc.CONSTRAINT_NAME 
                    AND k.CONSTRAINT_SCHEMA = rc.CONSTRAINT_SCHEMA
                WHERE 
                    k.TABLE_SCHEMA = ?
                    AND k.REFERENCED_TABLE_NAME = 'products'
            `, [dbName]);

            for (const fk of fks) {
                if (fk.DELETE_RULE !== 'CASCADE') {
                    console.log(`🔧 Updating foreign key constraint "${fk.CONSTRAINT_NAME}" on table "${fk.TABLE_NAME}" to ON DELETE CASCADE...`);
                    await connection.query(`ALTER TABLE \`${fk.TABLE_NAME}\` DROP FOREIGN KEY \`${fk.CONSTRAINT_NAME}\``);
                    await connection.query(`
                        ALTER TABLE \`${fk.TABLE_NAME}\` 
                        ADD CONSTRAINT \`${fk.CONSTRAINT_NAME}\` 
                        FOREIGN KEY (product_id) REFERENCES products(product_id) 
                        ON DELETE CASCADE ON UPDATE CASCADE
                    `);
                }
            }
        } catch (fkErr) {
            console.warn("⚠️ Foreign key CASCADE verification warning:", fkErr.message);
        }

        console.log(`🎉 Database "${dbName}" tables and structure synchronized successfully!`);
    } catch (err) {
        console.error("❌ Database initialization error:", err.message);
    } finally {
        if (connection) await connection.end();
    }
};

module.exports = initDb;
