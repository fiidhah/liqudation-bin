const db = require("../config/db");
const bcrypt = require("bcrypt");
const generateToken = require("../utils/generateToken");

// =============================
// GET ALL MANAGERS
// =============================
const getAllManagers = (req, res) => {

    const sql = "SELECT * FROM managers";

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
// REGISTER MANAGER
// =============================
const registerManager = async (req, res) => {

    const {
        full_name,
        email,
        password,
        phone,
        address
    } = req.body;

    if (!full_name || !email || !password) {
        return res.status(400).json({
            success: false,
            message: "Full name, email and password are required."
        });
    }

    const checkEmail = "SELECT * FROM managers WHERE email = ?";

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
                message: "Email already exists."
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const sql = `
            INSERT INTO managers
            (full_name, email, password, phone, address)
            VALUES (?, ?, ?, ?, ?)
        `;

        db.query(
            sql,
            [
                full_name,
                email,
                hashedPassword,
                phone,
                address
            ],
            (err, result) => {

                if (err) {
                    return res.status(500).json({
                        success: false,
                        message: err.message
                    });
                }

                res.status(201).json({
                    success: true,
                    message: "Manager registered successfully.",
                    managerId: result.insertId
                });

            }
        );

    });

};

// =============================
// LOGIN MANAGER
// =============================
const loginManager = (req, res) => {

    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: "Email and password are required."
        });
    }

    const sql = "SELECT * FROM managers WHERE email = ?";

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

        const manager = result[0];

        const isMatch = await bcrypt.compare(password, manager.password);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password."
            });
        }

        const token = generateToken(manager);

        res.status(200).json({
            success: true,
            message: "Manager login successful.",
            token,
            manager: {
                manager_id: manager.manager_id,
                full_name: manager.full_name,
                email: manager.email
            }
        });

    });

};

// =============================
// MANAGER PROFILE (Protected)
// =============================
const getManagerProfile = (req, res) => {

    res.status(200).json({
        success: true,
        message: "Protected Manager Route Access Granted",
        loggedInManager: req.user
    });

};
// =============================
// GET MANAGER BY ID
// =============================
const getManagerById = (req, res) => {

    const { id } = req.params;

    const sql = "SELECT * FROM managers WHERE manager_id = ?";

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
                message: "Manager not found."
            });
        }

        res.status(200).json({
            success: true,
            data: result[0]
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
        [
            full_name,
            email,
            phone,
            address,
            id
        ],
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

module.exports = {
    getAllManagers,
    registerManager,
    loginManager,
    getManagerProfile,
    getManagerById,
    updateManager,
    deleteManager
};