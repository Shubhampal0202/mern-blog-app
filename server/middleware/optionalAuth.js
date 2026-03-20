const jwt = require("jsonwebtoken");
const { verifyToken } = require("../utils/generateToken");
const User = require("../model/userSchema");


const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    let token = null;
    if (typeof authHeader === "string" && authHeader?.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }
    if (!token) {
      req.user = null;
      return next();
    }

    let decoded = await verifyToken(token);
    const user = await User.findOne({ _id: decoded._id }).select("saveBlogs");
    req.user = user || null;
    return next();
  } catch (err) {
    req.user = null;
    next();
  }
};
module.exports = optionalAuth;
