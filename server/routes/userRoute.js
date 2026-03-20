const express = require("express");
const router = express.Router();
const User = require("../model/userSchema");
const { authLimiter } = require("../middleware/rateLimiter");

const {
  createUser,
  getAllUsers,
  getSingleUser,
  updateUser,
  deleteUser,
  userLogin,
  fileUpload,
  followUserProfile,
  getFollowers,
  getFollowing,
  getUserBlogs,
  getUserSavedBlogs,
  getUserLikedBlogs,
  getUserDraftBlogs,
} = require("../controllers/userController");
const { verifyUser } = require("../middleware/auth");
const upload = require("../utils/multer");
const uploadMiddleware = require("../middleware/uploadMiddleware");
const optionalAuth = require("../middleware/optionalAuth");

router.post("/user/signup", authLimiter, createUser);
router.post("/user/signin", authLimiter, userLogin);
router.get("/user", getAllUsers);
router.get("/user/:username", optionalAuth, getSingleUser);
router.get("/blogs/:username/home", getUserBlogs);
router.get("/blogs/:username/saved-blogs", verifyUser, getUserSavedBlogs);
router.get("/blogs/:username/liked-blogs", verifyUser, getUserLikedBlogs);
router.get("/blogs/:username/draft-blogs", verifyUser, getUserDraftBlogs);
router.patch(
  "/user/:userId",
  verifyUser,
  uploadMiddleware("profilePic"),
  updateUser,
);

router.get("/user/:username/followers", getFollowers);
router.get("/user/:username/following", getFollowing);
router.delete("/user/:userId", verifyUser, deleteUser);
router.patch("/user/:username/follow", verifyUser, followUserProfile);

module.exports = router;
