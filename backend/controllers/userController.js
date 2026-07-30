const db = require("../config/db");
const bcrypt = require("bcrypt");

// =============================
// GET ALL USERS
// =============================
const getAllUsers = (req, res) => {

    const sql = "SELECT * FROM users";

    db.query(sql, (err, result) => {

        if (err) {
            return res.status(500).json({
                success: false,
                message: "Database Error",
                error: err.message
            });
        }

        res.status(200).json({
            success: true,
            message: "Users fetched successfully",
            totalUsers: result.length,
            data: result
        });

    });

};

// =============================
// REGISTER USER
// =============================
const registerUser = async (req, res) => {

    const { full_name, email, password, phone, address } = req.body;

    // Check required fields
    if (!full_name || !email || !password) {
        return res.status(400).json({
            success: false,
            message: "Full name, email and password are required."
        });
    }

    // Check if email already exists
    const checkEmailQuery = "SELECT * FROM users WHERE email = ?";

    db.query(checkEmailQuery, [email], async (err, result) => {

        if (err) {
            return res.status(500).json({
                success: false,
                message: err.message
            });
        }

        if (result.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Email already exists."
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert user
        const insertQuery = `
            INSERT INTO users
            (full_name, email, password, phone, address)
            VALUES (?, ?, ?, ?, ?)
        `;

        db.query(
            insertQuery,
            [full_name, email, hashedPassword, phone, address],
            (err, result) => {

                if (err) {
                    return res.status(500).json({
                        success: false,
                        message: err.message
                    });
                }

                res.status(201).json({
                    success: true,
                    message: "User registered successfully.",
                    userId: result.insertId
                });

            }
        );

    });

};

module.exports = {
    getAllUsers,
    registerUser
};