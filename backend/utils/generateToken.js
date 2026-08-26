const jwt = require("jsonwebtoken");

const generateToken = (account, role = "User") => {
    const payload = {
        id: account.user_id || account.manager_id || account.admin_id,
        user_id: account.user_id,
        manager_id: account.manager_id,
        admin_id: account.admin_id,
        full_name: account.full_name,
        email: account.email,
        role: account.role || role
    };

    return jwt.sign(payload, process.env.JWT_SECRET || "smartbin_super_secret_jwt_key_2026", {
        expiresIn: "7d"
    });
};

module.exports = generateToken;