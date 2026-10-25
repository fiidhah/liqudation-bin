const db = require("../config/db");
const bcrypt = require("bcrypt");
const generateToken = require("../utils/generateToken");

// =============================
// REGISTER ADMIN
// =============================
const registerAdmin = async (req, res) => {
    const { full_name, email, password, phone } = req.body;

    if (!full_name || !email || !password) {
        return res.status(400).json({
            success: false,
            message: "Full name, email and password are required."
        });
    }

    const checkEmail = "SELECT * FROM admins WHERE email = ?";

    db.query(checkEmail, [email], async (err, result) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: err.message
            });
        }

        if (result.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Admin email already exists."
            });
        }

        try {
            const hashedPassword = await bcrypt.hash(password, 10);
            const sql = "INSERT INTO admins (full_name, email, password, phone) VALUES (?, ?, ?, ?)";

            db.query(sql, [full_name, email, hashedPassword, phone || null], (err, insertRes) => {
                if (err) {
                    return res.status(500).json({
                        success: false,
                        message: err.message
                    });
                }

                res.status(201).json({
                    success: true,
                    message: "Admin registered successfully.",
                    adminId: insertRes.insertId
                });
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    });
};

// =============================
// ADMIN LOGIN
// =============================
const loginAdmin = (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: "Email and password are required."
        });
    }

    const sql = "SELECT * FROM admins WHERE email = ?";

    db.query(sql, [email], async (err, result) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: err.message
            });
        }

        if (result.length === 0) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password."
            });
        }

        try {
            const admin = result[0];
            const isMatch = await bcrypt.compare(password, admin.password);

            if (!isMatch) {
                return res.status(401).json({
                    success: false,
                    message: "Invalid email or password."
                });
            }

            const token = generateToken(admin, "Admin");

            res.status(200).json({
                success: true,
                message: "Admin login successful.",
                token,
                admin: {
                    admin_id: admin.admin_id,
                    full_name: admin.full_name,
                    email: admin.email,
                    role: "Admin"
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    });
};

// =============================
// ADMIN DASHBOARD SUMMARY
// =============================
const getDashboard = (req, res) => {
    const dashboardData = {};

    const qUsers = "SELECT COUNT(*) AS totalUsers FROM users";
    const qManagers = "SELECT COUNT(*) AS totalManagers FROM managers";
    const qProducts = "SELECT COUNT(*) AS totalProducts, IFNULL(SUM(quantity), 0) AS totalStock FROM products";
    const qOrders = "SELECT COUNT(*) AS totalOrders, IFNULL(SUM(total_amount), 0) AS totalRevenue FROM orders WHERE order_status != 'Cancelled'";
    const qDraws = "SELECT COUNT(*) AS totalDraws FROM lucky_draws";
    const qOffers = "SELECT COUNT(*) AS totalOffers FROM promotional_offers WHERE status = 'Active' OR status IS NULL";

    db.query(qUsers, (err, uRes) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        dashboardData.totalUsers = uRes[0].totalUsers;

        db.query(qManagers, (err, mRes) => {
            if (err) return res.status(500).json({ success: false, message: err.message });
            dashboardData.totalManagers = mRes[0].totalManagers;

            db.query(qProducts, (err, pRes) => {
                if (err) return res.status(500).json({ success: false, message: err.message });
                dashboardData.totalProducts = pRes[0].totalProducts;
                dashboardData.totalStock = pRes[0].totalStock;

                db.query(qOrders, (err, oRes) => {
                    if (err) return res.status(500).json({ success: false, message: err.message });
                    dashboardData.totalOrders = oRes[0].totalOrders;
                    dashboardData.totalRevenue = parseFloat(Number(oRes[0].totalRevenue).toFixed(2));

                    db.query(qDraws, (err, dRes) => {
                        if (err) return res.status(500).json({ success: false, message: err.message });
                        dashboardData.totalDraws = dRes[0].totalDraws;

                        db.query(qOffers, (err, offRes) => {
                            if (err) return res.status(500).json({ success: false, message: err.message });
                            dashboardData.activeOffers = offRes[0].totalOffers;

                            const recentOrdersSql = `
                                SELECT o.order_id, u.full_name, o.total_amount as final_amount, o.order_status, o.order_date
                                FROM orders o
                                JOIN users u ON o.user_id = u.user_id
                                ORDER BY o.order_id DESC
                                LIMIT 5
                            `;

                            db.query(recentOrdersSql, (err, recentOrders) => {
                                dashboardData.recentOrders = recentOrders || [];
                                res.status(200).json({
                                    success: true,
                                    dashboard: dashboardData
                                });
                            });
                        });
                    });
                });
            });
        });
    });
};

// =============================
// DELETE MANAGER
// =============================
const deleteManager = (req, res) => {
    const { id } = req.params;

    const sql = "DELETE FROM managers WHERE manager_id = ?";

    db.query(sql, [id], (err, result) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: err.message
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Manager not found."
            });
        }

        res.status(200).json({
            success: true,
            message: "Manager deleted successfully."
        });
    });
};

// =============================
// UPDATE MANAGER
// =============================
const updateManager = (req, res) => {
    const { id } = req.params;
    const { full_name, email, phone, address } = req.body;

    if (!full_name || !email) {
        return res.status(400).json({
            success: false,
            message: "Full name and email are required."
        });
    }

    const sql = `
        UPDATE managers
        SET full_name = ?, email = ?, phone = ?, address = ?
        WHERE manager_id = ?
    `;

    db.query(sql, [full_name, email, phone, address, id], (err, result) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: err.message
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Manager not found."
            });
        }

        res.status(200).json({
            success: true,
            message: "Manager updated successfully."
        });
    });
};

// =============================
// SALES REPORT & ANALYTICS
// =============================
const getSalesReport = (req, res) => {
    const report = {};

    const salesSql = `
        SELECT
            IFNULL(SUM(CASE WHEN LOWER(order_status) != 'cancelled' THEN total_amount ELSE 0 END), 0) AS totalSales,
            COUNT(*) AS totalOrders,
            SUM(CASE WHEN LOWER(order_status) = 'delivered' THEN 1 ELSE 0 END) AS deliveredOrders,
            SUM(CASE WHEN LOWER(order_status) = 'pending' THEN 1 ELSE 0 END) AS pendingOrders,
            SUM(CASE WHEN LOWER(order_status) = 'confirmed' THEN 1 ELSE 0 END) AS confirmedOrders,
            SUM(CASE WHEN LOWER(order_status) IN ('pending', 'confirmed') THEN 1 ELSE 0 END) AS processingOrders,
            SUM(CASE WHEN LOWER(order_status) = 'shipped' THEN 1 ELSE 0 END) AS shippedOrders,
            SUM(CASE WHEN LOWER(order_status) = 'cancelled' THEN 1 ELSE 0 END) AS cancelledOrders
        FROM orders
    `;

    db.query(salesSql, (err, statsResult) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: err.message
            });
        }

        report.summary = statsResult[0] || {};

        const dailySql = `
            SELECT 
                DATE_FORMAT(order_date, '%Y-%m-%d') as date,
                DATE_FORMAT(order_date, '%a') as day,
                IFNULL(SUM(CASE WHEN LOWER(order_status) != 'cancelled' THEN total_amount ELSE 0 END), 0) as revenue,
                COUNT(*) as orders
            FROM orders
            GROUP BY DATE_FORMAT(order_date, '%Y-%m-%d'), DATE_FORMAT(order_date, '%a')
            ORDER BY date DESC
            LIMIT 7
        `;

        db.query(dailySql, (err, dailyResults) => {
            report.dailyTrends = (dailyResults || []).reverse();

            const catSql = `
                SELECT 
                    COALESCE(p.category, 'General') as category, 
                    COUNT(oi.order_item_id) as items_sold, 
                    IFNULL(SUM(oi.price * oi.quantity), 0) as revenue
                FROM order_items oi
                JOIN products p ON oi.product_id = p.product_id
                JOIN orders o ON oi.order_id = o.order_id
                WHERE LOWER(o.order_status) != 'cancelled'
                GROUP BY p.category
                ORDER BY revenue DESC
            `;

            db.query(catSql, (err, catResults) => {
                report.categoryPerformance = catResults || [];

                const ordersSql = `
                    SELECT 
                        o.order_id,
                        o.user_id,
                        u.full_name,
                        u.email,
                        u.phone,
                        o.total_amount,
                        o.order_status,
                        o.order_date,
                        (SELECT COUNT(*) FROM order_items WHERE order_id = o.order_id) AS items_count
                    FROM orders o
                    LEFT JOIN users u ON o.user_id = u.user_id
                    ORDER BY o.order_id DESC
                `;

                db.query(ordersSql, (err, ordersList) => {
                    report.allOrders = ordersList || [];

                    res.status(200).json({
                        success: true,
                        salesReport: report
                    });
                });
            });
        });
    });
};

module.exports = {
    registerAdmin,
    loginAdmin,
    getDashboard,
    deleteManager,
    updateManager,
    getSalesReport
};
