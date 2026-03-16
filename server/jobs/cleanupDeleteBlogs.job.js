const Blog = require("../model/blogSchema");
const Comment = require("../model/commentSchema");
const cloudinary = require("../config/cloudinaryConfig");

async function cleanupDeleteBlogs() {
  try {
    const days = 10;
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const blogs = await Blog.find({
      isDeleted: true,
      deletedAt: { $lte: cutoff },
    });
    for (const blog of blogs) {
      try {
        await Comment.deleteMany({ blog: blog._id });
        if (blog.imageId) {
          await cloudinary.uploader.destroy(blog.imageId);
        }
        await Blog.deleteOne({ _id: blog._id });
        console.log("Cleaned blog:", blog._id);
      } catch (err) {
        console.error("cleanup failed ", blog._id);
      }
    }
  } catch (err) {
    console.error("Cleanup failed:", err);
  }
}
module.exports = cleanupDeleteBlogs;
