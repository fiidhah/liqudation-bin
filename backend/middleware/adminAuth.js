const jwt = require("jsonwebtoken");

const adminAuth = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({
                success: false,
                message: "Access Denied. No token provided."
            });
        }

        const token = authHeader.split(" ")[1];
        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Access Denied. Invalid token format."
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || "smartbin_super_secret_jwt_key_2026");
        
        // Admin token usually contains admin_id or role
        if (!decoded.admin_id && decoded.role !== "Admin") {
            // Check if user has admin credentials
            req.admin = decoded;
        } else {
            req.admin = decoded;
        }

        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Invalid or Expired Token."
        });
    }
};

module.exports = adminAuth;
