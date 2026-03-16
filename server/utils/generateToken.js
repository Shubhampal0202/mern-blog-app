const jwt = require("jsonwebtoken");
const crypto = require("crypto");
require("dotenv").config();
function generateToken(payload) {
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "7d" });
  return token;
}
function verifyToken(token) {
  const payload = jwt.verify(token, process.env.JWT_SECRET);
  return payload;
}

function getHashToken() {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const hashToken = crypto.createHash("sha256").update(rawToken).digest("hex");
  return { rawToken, hashToken };
}

module.exports = { generateToken, verifyToken, getHashToken };
