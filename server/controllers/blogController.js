const Blog = require("../model/blogSchema");
const User = require("../model/userSchema");
const mongoose = require("mongoose");
const { verifyToken } = require("../utils/generateToken");
const Comment = require("../model/commentSchema");
const cloudinary = require("../config/cloudinaryConfig");
const ShortUniqueId = require("short-unique-id");

async function createBlog(req, res) {
  try {
    let { title, description, draft = "false", tags } = req.body;
    const file = req.file;
    if (!file) {
      return res
        .status(400)
        .json({ success: false, message: "Image is required" });
    }

    if (!title) {
      return res
        .status(400)
        .json({ success: false, message: "title is required" });
    }
    if (!description) {
      return res
        .status(400)
        .json({ success: false, message: "description is required" });
    }

    let isPrivate;

    if (typeof title === "string" && title.trim().length < 5) {
      return res.status(400).json({
        success: false,
        message: "Title must be at least 5 characters",
      });
    }

    if (title.trim().length > 50) {
      return res.status(400).json({
        success: false,
        message: "Title must be at most 50 characters",
      });
    }
    if (typeof description === "string" && description.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: "Description must be at least 10 characters",
      });
    }

    if (description.trim().length > 120) {
      return res.status(400).json({
        success: false,
        message: "Description must be at most 120 characters",
      });
    }

    if (draft === "true") {
      isPrivate = true;
    } else if (draft === "false") {
      isPrivate = false;
    } else {
      return res
        .status(400)
        .json({ success: false, message: "Draft can be true or false" });
    }

    if (tags) {
      try {
        tags = JSON.parse(tags);
        if (!Array.isArray(tags) || !tags.every((t) => typeof t === "string")) {
          return res.status(400).json({
            success: false,
            message: "tags must be an array of string",
          });
        }
      } catch (err) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid JSON format for tags" });
      }
    }
    const creator = req.user._id;
    let blogId = title?.toLowerCase().split(" ").join("-");
    const uid = new ShortUniqueId({ length: 10 });
    const uniqueId = uid.rnd();
    blogId = blogId + "-" + uniqueId;
    

    const { secure_url, public_id } = await cloudinary.uploader.upload(
      `data:${file.mimetype};base64,${file.buffer.toString("base64")}`,
      {
        folder: "Blog-App",
      },
    );


    let blog;

    try {
      blog = new Blog({
        title,
        description,
        draft: isPrivate,
        tags,
        creator,
        blogId,
        image: secure_url,
        imageId: public_id,
      });
      await blog.save();
  
      return res.status(201).json({
        success: true,
        message: isPrivate
          ? "Blog saved as a private"
          : "Blog created successfully",
      });
    } catch (err) {
      console.error(err);
      if (public_id) {
        await cloudinary.uploader.destroy(public_id);
      }

      throw err;
    }
  } catch (err) {
    console.error(err);
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages[0] });
    }
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0];

      return res.status(409).json({
        success: false,
        message: `${field} already exists`,
      });
    }

    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
}

async function getBlog(req, res) {
  const user = req.user;
  const { blogId } = req.params;
  try {
    const blog = await Blog.findOne({ blogId, draft: false, isDeleted: false })
      .populate({
        path: "creator",
        select: "name email followers userName",
      })
      .lean();
    
    if (!blog) {
      return res
        .status(404)
        .json({ success: false, message: "Blog not found" });
    }


    const comments = await Comment.find({
      blog: blog._id,
      isDeleted: false,
    })
      .select("comment likes parentComment createdAt user")
      .populate({
        path: "user",
        select: "name",
      })
      .lean();

    function buildCommentsTree(comments) {
      const root = [];
      const map = new Map();
      for (const comment of comments) {
        map.set(comment._id.toString(), {
          ...comment,
          replies: [],
        });
      }
      for (const comment of comments) {
        const current = map.get(comment._id.toString());
        if (comment.parentComment) {
          const parent = map.get(comment.parentComment.toString());
          if (parent) {
            current.parentDeleted = false;
            parent.replies.push(current);
          } else {
            current.parentDeleted = true;
            root.push(current);
          }
        } else {
          root.push(current);
        }
      }
      return root;
    }
    const commentTree = buildCommentsTree(comments);
    const saveBlogs = user?.saveBlogs || [];
    const isSave = saveBlogs.some(
      (id) => id.toString() === blog._id.toString(),
    );

    return res.status(200).json({
      success: true,
      blog,
      comments: commentTree,
      commentsCount: comments.length,
      isSave,
    });
  } catch (err) {
    console.error("Error while getting blog ", err);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
}

async function getAllBlogs(req, res) {
  const user = req.user;

  let { tag, search, cursor, limit } = req.query;
  limit = Math.min(Number(limit) || 2, 4);
  let baseQuery = { draft: false, isDeleted: false };

  if (cursor) {
    baseQuery.createdAt = { $lt: new Date(cursor) };
  }
  let filters = [];
  if (tag) {
    filters.push({ tags: { $regex: `^${tag}$`, $options: "i" } });
  }
  if (search) {
    filters.push({
      $or: [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ],
    });
  }
  const finalQuery =
    filters.length > 0 ? { ...baseQuery, $and: filters } : baseQuery;
  try {
    const blogs = await Blog.find(finalQuery)
      .sort({ createdAt: -1 })
      .limit(limit + 1)
      .populate({
        path: "creator",
        select: "name email",
      });

    const hasMore = blogs.length > limit;
    if (hasMore) {
      blogs.pop();
    }
    const nextCursor =
      blogs.length > 0 ? blogs[blogs.length - 1].createdAt : null;
    const saveBlogs = user?.saveBlogs || [];
    const finalBlogs = blogs.map((blog) => ({
      ...blog.toObject(),
      isSave: saveBlogs.some((id) => id.equals(blog._id)),
    }));
    return res
      .status(200)
      .json({ success: true, blogs: finalBlogs, hasMore, nextCursor });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
}

async function updateBlog(req, res) {
  try {
    const loggedInUser = req.user._id;
    const { blogId } = req.params;
    let { title, description, draft, tags } = req.body;
    let isPrivate;
    const file = req.file;

    if (draft !== undefined) {
      const value = String(draft);
      if (value !== "true" && value !== "false") {
        return res
          .status(400)
          .json({ success: false, message: "Draft can be true or false" });
      }
      isPrivate = value === "true";
    }

    if (tags) {
      try {
        tags = JSON.parse(tags);
        if (
          !Array.isArray(tags) ||
          !tags.every((val) => typeof val === "string")
        ) {
          return res.status(400).json({
            success: false,
            message: "tags must be an array of string",
          });
        }
      } catch (err) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid JSON format for tags" });
      }
    }
    const blog = await Blog.findOne({ blogId, isDeleted: false });
    if (!blog) {
      return res
        .status(404)
        .json({ success: false, message: "Blog not found" });
    }

    if (!loggedInUser.equals(blog.creator)) {
      return res
        .status(403)
        .json({ success: false, message: "You are not authorized person" });
    }
    let uploadedImage;
    let oldImageId = blog.imageId;
    try {
      if (file) {
        uploadedImage = await cloudinary.uploader.upload(
          `data:${file.mimetype};base64,${file.buffer.toString("base64")}`,
          {
            folder: "Blog-App",
          },
        );
        blog.image = uploadedImage.secure_url;
        blog.imageId = uploadedImage.public_id;
      }

      blog.title = title || blog.title;
      blog.description = description || blog.description;
      blog.draft = draft === undefined ? blog.draft : isPrivate;
      blog.tags = tags || blog.tags;
      await blog.save();
    } catch (err) {
      if (uploadedImage?.public_id) {
        await cloudinary.uploader.destroy(uploadedImage.public_id);
      }
      throw err;
    }
    try {
      if (file && oldImageId) {
        await cloudinary.uploader.destroy(oldImageId);
      }
    } catch (err) {
      console.error("Orphaned image:", oldImageId);
    }

    return res.status(200).json({
      success: true,
      message:
        draft && isPrivate
          ? "Blog saved as a private you can make it public from your profile"
          : "Blog updated successfully",
    });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
}

async function deleteBlog(req, res) {
  try {
    const userId = req.user._id;
    const { blogId } = req.params;
    const blog = await Blog.findOne({ blogId });
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    const deletedBlog = await Blog.findOneAndUpdate(
      {
        blogId,
        creator: userId,
        isDeleted: false,
      },
      { isDeleted: true, deletedAt: new Date() },
      { new: true },
    );
    if (!deletedBlog) {
      return res.status(403).json({
        success: false,
        message: "Not authorized or blog not found",
      });
    }
    await Comment.updateMany(
      { blog: blog._id },
      { isDeleted: true, deletedAt: new Date() },
    );
    // remove blog from liked blogs
    await User.updateMany(
      { likeBlogs: blog._id },
      { $pull: { likeBlogs: blog._id } },
    );

    // remove blog from saved blogs
    await User.updateMany(
      { saveBlogs: blog._id },
      { $pull: { saveBlogs: blog._id } },
    );

    return res
      .status(200)
      .json({ success: true, message: "Blog deleted successfully" });
  } catch (err) {
    console.error("Error while deleting blog ", err);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}

async function likeBlog(req, res) {
  try {
    const userId = req.user._id;
    const { blogId } = req.params;

    const blog = await Blog.findOne({ blogId, draft: false, isDeleted: false });
    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    const result = await Blog.updateOne(
      { blogId, likes: userId },
      { $pull: { likes: userId } },
    );

    if (result.modifiedCount === 1) {
      await User.updateOne({ _id: userId }, { $pull: { likeBlogs: blog._id } });
      return res
        .status(200)
        .json({ success: true, message: "blog unliked successfully" });
    }
    await Blog.updateOne({ blogId }, { $addToSet: { likes: userId } });
    await User.updateOne(
      { _id: userId },
      { $addToSet: { likeBlogs: blog._id } },
    );

    return res
      .status(200)
      .json({ success: true, message: "blog liked successfully" });
  } catch (err) {
    console.error("Error while liking the blog ", err);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
}
async function saveBlog(req, res) {
  try {
    const userId = req.user._id;
    const { blogId } = req.params;

    const blog = await Blog.findOne({ blogId, draft: false, isDeleted: false });
    if (!blog) {
      return res
        .status(404)
        .json({ success: false, message: "Blog not found" });
    }
    const result = await User.updateOne(
      { _id: userId, saveBlogs: blog._id },
      { $pull: { saveBlogs: blog._id } },
    );
    if (result.modifiedCount === 1) {
      return res.status(200).json({
        success: true,
        saved: false,
        message: "Blog unsaved successfully",
      });
    }
    await User.updateOne(
      { _id: userId },
      { $addToSet: { saveBlogs: blog._id } },
    );
    return res
      .status(200)
      .json({ success: true, saved: true, message: "Blog saved successfully" });
  } catch (err) {
    console.error("Error while blog saving/unsaving ", err);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
}

module.exports = {
  createBlog,
  getAllBlogs,
  updateBlog,
  deleteBlog,
  likeBlog,
  getBlog,
  saveBlog,
};
