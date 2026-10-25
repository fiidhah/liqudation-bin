const db = require("../config/db");
const bcrypt = require("bcrypt");
const generateToken = require("../utils/generateToken");
const { isValidEmail, isValidPhone, isValidPassword, isValidText } = require("../utils/validator");

// =============================
// GET ALL MANAGERS
// =============================
const getAllManagers = (req, res) => {
    const sql = "SELECT manager_id, full_name, email, phone, address, created_at FROM managers";

    db.query(sql, (err, result) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: err.message
            });
        }

        res.status(200).json({
            success: true,
            totalManagers: result.length,
            data: result
        });
    });
};

// =============================
// REGISTER / ADD MANAGER (With Validation)
// =============================
const registerManager = async (req, res) => {
    const { full_name, email, password, phone, address } = req.body;

    if (!isValidText(full_name, 2)) {
        return res.status(400).json({
            success: false,
            message: "Manager name must be at least 2 characters long."
        });
    }

    if (!isValidEmail(email)) {
        return res.status(400).json({
            success: false,
            message: "Please provide a valid manager email address."
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
            message: "Please enter a valid 10-digit phone number."
        });
    }

    const cleanEmail = email.trim().toLowerCase();
    const checkEmail = "SELECT * FROM managers WHERE LOWER(email) = ?";

    db.query(checkEmail, [cleanEmail], async (err, result) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: err.message
            });
        }

        if (result.length > 0) {
            return res.status(400).json({
                success: false,
                message: "A manager with this email already exists."
            });
        }

        try {
            const hashedPassword = await bcrypt.hash(password, 10);
            const sql = "INSERT INTO managers (full_name, email, password, phone, address) VALUES (?, ?, ?, ?, ?)";

            db.query(sql, [full_name.trim(), cleanEmail, hashedPassword, phone ? String(phone).trim() : null, address ? address.trim() : null], (err, insertRes) => {
                if (err) {
                    return res.status(500).json({
                        success: false,
                        message: err.message
                    });
                }

                res.status(201).json({
                    success: true,
                    message: "Manager registered successfully.",
                    managerId: insertRes.insertId
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
// LOGIN MANAGER
// =============================
const loginManager = (req, res) => {
    const { email, password } = req.body;

    if (!isValidEmail(email)) {
        return res.status(400).json({
            success: false,
            message: "Please provide a valid email address."
        });
    }

    if (!password) {
        return res.status(400).json({
            success: false,
            message: "Password is required."
        });
    }

    const cleanEmail = email.trim().toLowerCase();
    const sql = "SELECT * FROM managers WHERE LOWER(email) = ?";

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
                message: "No manager found with this email."
            });
        }

        const manager = result[0];
        let isMatch = false;

        if (manager.password && manager.password.startsWith("$2")) {
            isMatch = await bcrypt.compare(password, manager.password);
        } else {
            isMatch = (password === manager.password);
        }

        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: "Incorrect password."
            });
        }

        const token = generateToken(manager.manager_id, "Manager");

        res.status(200).json({
            success: true,
            message: "Manager login successful.",
            token,
            manager: {
                manager_id: manager.manager_id,
                full_name: manager.full_name,
                email: manager.email,
                phone: manager.phone,
                address: manager.address,
                role: "Manager"
            }
        });
    });
};

// =============================
// GET MANAGER PROFILE
// =============================
const getManagerProfile = (req, res) => {
    const managerId = req.user ? req.user.id : (req.query.id || 1);

    const sql = "SELECT manager_id, full_name, email, phone, address, created_at FROM managers WHERE manager_id = ?";

    db.query(sql, [managerId], (err, result) => {
        if (err) {
            return res.status(500).json({ success: false, message: err.message });
        }

        if (result.length === 0) {
            return res.status(404).json({ success: false, message: "Manager not found." });
        }

        res.status(200).json({ success: true, data: result[0] });
    });
};

// =============================
// GET MANAGER BY ID
// =============================
const getManagerById = (req, res) => {
    const { id } = req.params;

    const sql = "SELECT manager_id, full_name, email, phone, address, created_at FROM managers WHERE manager_id = ?";

    db.query(sql, [id], (err, result) => {
        if (err) {
            return res.status(500).json({ success: false, message: err.message });
        }

        if (result.length === 0) {
            return res.status(404).json({ success: false, message: "Manager not found." });
        }

        res.status(200).json({ success: true, data: result[0] });
    });
};

// =============================
// UPDATE MANAGER
// =============================
const updateManager = async (req, res) => {
    const { id } = req.params;
    const { full_name, email, password, phone, address } = req.body;

    if (full_name && !isValidText(full_name, 2)) {
        return res.status(400).json({ success: false, message: "Full name must be at least 2 characters." });
    }

    if (email && !isValidEmail(email)) {
        return res.status(400).json({ success: false, message: "Invalid email format." });
    }

    if (phone && !isValidPhone(phone)) {
        return res.status(400).json({ success: false, message: "Invalid 10-digit phone number." });
    }

    let hashedPassword = null;
    if (password && password.trim().length > 0) {
        if (!isValidPassword(password)) {
            return res.status(400).json({ success: false, message: "Password must be at least 6 characters." });
        }
        hashedPassword = await bcrypt.hash(password, 10);
    }

    const sql = `
        UPDATE managers
        SET full_name = COALESCE(?, full_name),
            email = COALESCE(?, email),
            password = COALESCE(?, password),
            phone = COALESCE(?, phone),
            address = COALESCE(?, address)
        WHERE manager_id = ?
    `;

    db.query(
        sql,
        [full_name ? full_name.trim() : null, email ? email.trim().toLowerCase() : null, hashedPassword, phone ? String(phone).trim() : null, address ? address.trim() : null, id],
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
                    message: "Manager record not found."
                });
            }

            res.status(200).json({
                success: true,
                message: "Manager record updated successfully."
            });
        }
    );
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
                message: "Manager record not found."
            });
        }

        res.status(200).json({
            success: true,
            message: "Manager deleted successfully."
        });
    });
};

module.exports = {
    getAllManagers,
    registerManager,
    loginManager,
    getManagerProfile,
    getManagerById,
    updateManager,
    deleteManager
};