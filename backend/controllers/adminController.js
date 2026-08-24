const db = require("../config/db");
const bcrypt = require("bcrypt");
const generateToken = require("../utils/generateToken");

// =============================
// REGISTER ADMIN
// =============================
const registerAdmin = async (req, res) => {

    const { full_name, email, password } = req.body;

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

            const sql = `
                INSERT INTO admins
                (full_name, email, password)
                VALUES (?, ?, ?)
            `;

            db.query(
                sql,
                [full_name, email, hashedPassword],
                (err, result) => {

                    if (err) {
                        return res.status(500).json({
                            success: false,
                            message: err.message
                        });
                    }

                    res.status(201).json({
                        success: true,
                        message: "Admin registered successfully.",
                        adminId: result.insertId
                    });

                }
            );

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

            const isMatch = await bcrypt.compare(
                password,
                admin.password
            );

            if (!isMatch) {
                return res.status(401).json({
                    success: false,
                    message: "Invalid email or password."
                });
            }

            const token = generateToken(admin);

            res.status(200).json({
                success: true,
                message: "Admin login successful.",
                token,
                admin: {
                    admin_id: admin.admin_id,
                    full_name: admin.full_name,
                    email: admin.email
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
// ADMIN DASHBOARD
// =============================
const getDashboard = (req, res) => {

    const dashboardData = {};

    // Total Users
    db.query(
        "SELECT COUNT(*) AS totalUsers FROM users",
        (err, userResult) => {

            if (err) {
                return res.status(500).json({
                    success: false,
                    message: err.message
                });
            }

            dashboardData.totalUsers = userResult[0].totalUsers;

            // Total Managers
            db.query(
                "SELECT COUNT(*) AS totalManagers FROM managers",
                (err, managerResult) => {

                    if (err) {
                        return res.status(500).json({
                            success: false,
                            message: err.message
                        });
                    }

                    dashboardData.totalManagers =
                        managerResult[0].totalManagers;

                    // Total Products
                    db.query(
                        "SELECT COUNT(*) AS totalProducts FROM products",
                        (err, productResult) => {

                            if (err) {
                                return res.status(500).json({
                                    success: false,
                                    message: err.message
                                });
                            }

                            dashboardData.totalProducts =
                                productResult[0].totalProducts;

                            // Total Orders
                            db.query(
                                "SELECT COUNT(*) AS totalOrders FROM orders",
                                (err, orderResult) => {

                                    if (err) {
                                        return res.status(500).json({
                                            success: false,
                                            message: err.message
                                        });
                                    }

                                    dashboardData.totalOrders =
                                        orderResult[0].totalOrders;

                                    // Send Dashboard Data
                                    res.status(200).json({
                                        success: true,
                                        dashboard: dashboardData
                                    });

                                }
                            );

                        }
                    );

                }
            );

        }
    );

};
// =============================
// DELETE MANAGER
// =============================
const deleteManager = (req, res) => {

    const { id } = req.params;

    const sql = `
        DELETE FROM managers
        WHERE manager_id = ?
    `;

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

    const {
        full_name,
        email,
        phone,
        address
    } = req.body;

    if (!full_name || !email) {
        return res.status(400).json({
            success: false,
            message: "Full name and email are required."
        });
    }

    const sql = `
        UPDATE managers
        SET
            full_name = ?,
            email = ?,
            phone = ?,
            address = ?
        WHERE manager_id = ?
    `;

    db.query(
        sql,
        [full_name, email, phone, address, id],
        (err, result) => {

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

        }
    );

};
// =============================
// SALES REPORT
// =============================
const getSalesReport = (req, res) => {

    const sql = `
        SELECT
            COUNT(*) AS totalOrders,

            COALESCE(SUM(total_amount), 0) AS totalSales,

            SUM(
                CASE
                    WHEN order_status = 'Delivered'
                    THEN 1
                    ELSE 0
                END
            ) AS deliveredOrders,

            SUM(
                CASE
                    WHEN order_status = 'Cancelled'
                    THEN 1
                    ELSE 0
                END
            ) AS cancelledOrders

        FROM orders
    `;

    db.query(sql, (err, result) => {

        if (err) {
            return res.status(500).json({
                success: false,
                message: err.message
            });
        }

        res.status(200).json({
            success: true,
            report: result[0]
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
