const jwt = require("jsonwebtoken");

const generateToken = (user) => {

    const token = jwt.sign(
        {
            user_id: user.user_id,
            email: user.email
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "1d"
        }
    );

    return token;

};

module.exports = generateToken;