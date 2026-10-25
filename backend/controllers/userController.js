const db = require("../config/db");
const bcrypt = require("bcrypt");
const generateToken = require("../utils/generateToken");
const { isValidEmail, isValidPhone, isValidPassword, isValidText } = require("../utils/validator");

// =============================
// GET ALL USERS
// =============================
const getAllUsers = (req, res) => {
    const sql = "SELECT user_id, full_name, email, phone, address, created_at FROM users";

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
// REGISTER USER (With Comprehensive Validation)
// =============================
const registerUser = async (req, res) => {
    const { full_name, email, password, phone, address } = req.body;

    if (!isValidText(full_name, 2)) {
        return res.status(400).json({
            success: false,
            message: "Please provide a valid full name (minimum 2 characters)."
        });
    }

    if (!isValidEmail(email)) {
        return res.status(400).json({
            success: false,
            message: "Please provide a valid email address."
        });
    }

    if (!isValidPassword(password)) {
        return res.status(400).json({
            success: false,
            message: "Password must be at least 6 characters long."
        });
    }

    if (phone && !isValidPhone(phone)) {
        return res.status(400).json({
            success: false,
            message: "Please provide a valid 10-digit phone number."
        });
    }

    const cleanEmail = email.trim().toLowerCase();
    const checkEmailQuery = "SELECT * FROM users WHERE LOWER(email) = ?";

    db.query(checkEmailQuery, [cleanEmail], async (err, result) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: err.message
            });
        }

        if (result.length > 0) {
            return res.status(400).json({
                success: false,
                message: "An account with this email already exists."
            });
        }

        try {
            const hashedPassword = await bcrypt.hash(password, 10);
            const insertQuery = "INSERT INTO users (full_name, email, password, phone, address) VALUES (?, ?, ?, ?, ?)";

            db.query(
                insertQuery,
                [full_name.trim(), cleanEmail, hashedPassword, phone ? String(phone).trim() : null, address ? address.trim() : null],
                (err, result) => {
                    if (err) {
                        return res.status(500).json({
                            success: false,
                            message: err.message
                        });
                    }

                    res.status(201).json({
                        success: true,
                        message: "Account created successfully.",
                        userId: result.insertId
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
// LOGIN USER (With Validation)
// =============================
const loginUser = (req, res) => {
    const { email, password } = req.body;

    if (!isValidEmail(email)) {
        return res.status(400).json({
            success: false,
            message: "Please enter a valid email address."
        });
    }

    if (!password) {
        return res.status(400).json({
            success: false,
            message: "Password is required."
        });
    }

    const cleanEmail = email.trim().toLowerCase();
    const sql = "SELECT * FROM users WHERE LOWER(email) = ?";

    db.query(sql, [cleanEmail], async (err, result) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: err.message
            });
        }

        if (result.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No user found with this email address."
            });
        }

        const user = result[0];
        let isMatch = false;

        if (user.password && user.password.startsWith("$2")) {
            isMatch = await bcrypt.compare(password, user.password);
        } else {
            isMatch = (password === user.password);
        }

        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: "Incorrect password."
            });
        }

        const token = generateToken(user.user_id, "User");

        res.status(200).json({
            success: true,
            message: "Login successful.",
            token,
            user: {
                user_id: user.user_id,
                full_name: user.full_name,
                email: user.email,
                phone: user.phone,
                address: user.address,
                role: "User"
            }
        });
    });
};

// =============================
// GET USER PROFILE
// =============================
const getUserProfile = (req, res) => {
    const { id } = req.params;

    const sql = "SELECT user_id, full_name, email, phone, address, created_at FROM users WHERE user_id = ?";

    db.query(sql, [id], (err, result) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: err.message
            });
        }

        if (result.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User profile not found."
            });
        }

        res.status(200).json({
            success: true,
            data: result[0]
        });
    });
};

// =============================
// UPDATE USER PROFILE
// =============================
const updateUser = (req, res) => {
    const { id } = req.params;
    const { full_name, phone, address } = req.body;

    if (phone && !isValidPhone(phone)) {
        return res.status(400).json({
            success: false,
            message: "Please provide a valid 10-digit phone number."
        });
    }

    const sql = "UPDATE users SET full_name = COALESCE(?, full_name), phone = COALESCE(?, phone), address = COALESCE(?, address) WHERE user_id = ?";

    db.query(sql, [full_name ? full_name.trim() : null, phone ? String(phone).trim() : null, address ? address.trim() : null, id], (err, result) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: err.message
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        res.status(200).json({
            success: true,
            message: "Profile updated successfully."
        });
    });
};

module.exports = {
    getAllUsers,
    registerUser,
    loginUser,
    getUserProfile,
    updateUser
};