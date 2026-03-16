const express = require("express");
const multer = require("multer");
const router = express.Router();
const Blog = require("../model/blogSchema");
const upload = require("../utils/multer");
const uploadMiddleware = require("../middleware/uploadMiddleware");

const {
  createBlog,
  getAllBlogs,
  updateBlog,
  deleteBlog,
  likeBlog,
  getBlog,
  saveBlog,
} = require("../controllers/blogController");

const { verifyUser } = require("../middleware/auth");
const {
  addComment,
  deleteComment,
  editComment,
  likeComment,
  addNestedComment,
} = require("../controllers/commentController");
const optionalAuth = require("../middleware/optionalAuth");

router.post("/blog", verifyUser, uploadMiddleware("file"), createBlog);
router.get("/blog", optionalAuth, getAllBlogs);
router.get("/blog/:blogId", optionalAuth, getBlog);
router.patch("/blog/:blogId", verifyUser, uploadMiddleware("file"), updateBlog);
router.patch("/blog/delete/:blogId", verifyUser, deleteBlog);
router.post("/blog/like/:blogId", verifyUser, likeBlog);
router.patch("/blog/save/:blogId", verifyUser, saveBlog);

router.post("/blog/:blogId/comment", verifyUser, addComment);
router.post(
  "/blog/:blogId/reply/:parentCommentId",
  verifyUser,
  addNestedComment,
);
router.patch("/blog/comment/:commentId", verifyUser, deleteComment);

router.patch("/blog/edit-comment/:commentId", verifyUser, editComment);
router.patch("/blog/like-comment/:commentId", verifyUser, likeComment);

module.exports = router;
