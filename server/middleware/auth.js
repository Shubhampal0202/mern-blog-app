const User = require("../model/userSchema");
const { verifyToken } = require("../utils/generateToken");

async function verifyUser(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    let token = null;
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }
    
    if (!token) {
      return res.status(401).json({
        success: false,
        code: "TOKEN_MISSING",
        message: "Authentication token required",
      });
    }
    let decoded;
    try {
      decoded = await verifyToken(token);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({
          success: false,
          message: "Token expired",
          code: "TOKEN_EXPIRED",
        });
      }
      return res.status(401).json({
        success: false,
        message: "Invalid token",
        code: "INVALID_TOKEN",
      });
    }

    const user = await User.findById(decoded._id);
    if (!user) {
      return res.status(401).json({
        success: false,
        code: "AUTH_FAILED",
        message: "Authentication failed",
      });
    }
    req.user = user;
    next();
  } catch (err) {
    console.error("err", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}

module.exports = { verifyUser };
