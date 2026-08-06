const db = require("../config/db");
const bcrypt = require("bcrypt");
const generateToken = require("../utils/generateToken");

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

    if (!full_name || !email || !password) {
        return res.status(400).json({
            success: false,
            message: "Full name, email and password are required."
        });
    }

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

        const hashedPassword = await bcrypt.hash(password, 10);

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

// =============================
// LOGIN USER
// =============================
const loginUser = (req, res) => {

    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: "Email and password are required."
        });
    }

    const sql = "SELECT * FROM users WHERE email = ?";

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

        const user = result[0];

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password."
            });
        }

        const token = generateToken(user);

        res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            user: {
                user_id: user.user_id,
                full_name: user.full_name,
                email: user.email
            }
        });

    });

};

// =============================
// USER PROFILE
// =============================
const getUserProfile = (req, res) => {

    res.status(200).json({
        success: true,
        message: "Protected Route Access Granted",
        loggedInUser: req.user
    });

};

module.exports = {
    getAllUsers,
    registerUser,
    loginUser,
    getUserProfile
};