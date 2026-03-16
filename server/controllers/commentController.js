const mongoose = require("mongoose");
const Blog = require("../model/blogSchema");
const Comment = require("../model/commentSchema");

async function addComment(req, res) {
  try {
    const userId = req.user._id;
    const { blogId } = req.params;
    const { comment } = req.body;

    if (typeof comment !== "string") {
      return res
        .status(400)
        .json({ success: false, message: "Comment text should be String" });
    }
    if (!comment || comment.trim().length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Comment text is required" });
    }
    if (comment.trim().length > 50) {
      return res.status(400).json({
        success: false,
        message: "Comment must be at most 50 characters",
      });
    }

    let blog = await Blog.findOne({ blogId, draft: false, isDeleted: false });
    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    const newComment = await Comment.create({
      comment,
      user: userId,
      blog: blog._id,
    });
    await Blog.updateOne({ _id: blog._id }, { $inc: { commentsCount: 1 } });

    return res.status(201).json({
      success: true,
      message: "Comment added successfully",
      comment: {
        _id: newComment._id.toString(),
        comment: newComment.comment,
        createdAt: newComment.createdAt,
        parentComment: null,
        likes: [],
        replies: [],
        user: {
          _id: userId.toString(),
          name: req.user.name,
        },
      },
    });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
}

async function addNestedComment(req, res) {
  try {
    const userId = req.user._id;
    const { blogId, parentCommentId } = req.params;
    const { comment: replyText } = req.body;
    if (!mongoose.Types.ObjectId.isValid(parentCommentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid parent comment id",
      });
    }

    if (typeof replyText !== "string") {
      return res
        .status(400)
        .json({ success: false, message: "Comment text should be String" });
    }
    if (!replyText || replyText.trim().length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Comment text is required" });
    }
    if (replyText.trim().length > 50) {
      return res.status(400).json({
        success: false,
        message: "Comment must be at most 50 characters",
      });
    }
    const blog = await Blog.findOne({ blogId, draft: false, isDeleted: false });
    if (!blog) {
      return res
        .status(404)
        .json({ success: false, message: "Blog Not Found" });
    }
    const parentComment = await Comment.findById(parentCommentId);
    if (!parentComment) {
      return res
        .status(404)
        .json({ success: false, message: "Parent comment is not found" });
    }
    if (parentComment.isDeleted) {
      return res.status(400).json({
        success: false,
        message: "Cannot reply to a deleted comment",
      });
    }
    if (!parentComment.blog.equals(blog._id)) {
      return res.status(400).json({
        success: false,
        message: "Parent comment does not belong to this blog",
      });
    }
    const reply = await Comment.create({
      comment: replyText,
      blog: blog._id,
      user: userId,
      parentComment: parentComment._id,
    });
    await Blog.updateOne({ _id: blog._id }, { $inc: { commentsCount: 1 } });
    return res.status(201).json({
      success: true,
      message: "Reply added successfully",
      comment: {
        _id: reply._id.toString(),
        comment: reply.comment,
        createdAt: reply.createdAt,
        parentComment: reply.parentComment,
        replies: [],
        likes: [],
        user: {
          _id: userId.toString(),
          name: req.user.name,
        },
      },
    });
  } catch (err) {
    console.error("Add nested comment error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
}

async function deleteComment(req, res) {
  try {
    const userId = req.user._id;
    const { commentId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      return res
        .status(400)
        .json({ success: false, message: "Comment Id is not valid" });
    }
    const comment = await Comment.findById(commentId).populate({
      path: "blog",
      select: "creator",
    });

    if (!comment) {
      return res
        .status(404)
        .json({ success: false, message: "Comment not found" });
    }
    if (!comment.blog) {
      return res.status(404).json({
        success: false,
        message: "Blog associated with this comment no longer exist",
      });
    }

    if (!comment.user.equals(userId) && !comment.blog.creator.equals(userId)) {
      return res
        .status(403)
        .json({ success: false, message: "you are not authorized person" });
    }

    if (comment.isDeleted) {
      return res.status(400).json({
        success: false,
        message: "Comment already deleted",
      });
    }
    await Comment.findByIdAndUpdate(
      comment._id,
      {
        isDeleted: true,
        deletedAt: new Date(),
      },
      { new: true },
    );
    await Blog.updateOne(
      { _id: comment.blog },
      { $inc: { commentsCount: -1 } },
    );

    return res
      .status(200)
      .json({ success: true, message: "Comment deleted successfully" });
  } catch (err) {
    console.error("Delete comment error ", err);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
}

async function editComment(req, res) {
  try {
    const userId = req.user._id;
    const { commentId } = req.params;
    const { comment: tobeUpdateComment } = req.body;

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      return res
        .status(400)
        .json({ success: false, message: "Comment Id is not valid" });
    }

    if (typeof tobeUpdateComment !== "string") {
      return res
        .status(400)
        .json({ success: false, message: "Comment text should be String" });
    }
    if (!tobeUpdateComment || tobeUpdateComment.trim().length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Comment text is required" });
    }
    if (tobeUpdateComment.trim().length > 50) {
      return res.status(400).json({
        success: false,
        message: "Comment must be at most 50 characters",
      });
    }

    let comment = await Comment.findById(commentId).populate("blog", "draft");
    if (!comment) {
      return res
        .status(404)
        .json({ success: false, message: "Comment not found" });
    }

    if (!comment.blog) {
      return res
        .status(404)
        .json({ success: false, message: "Blog not found" });
    }
    if (comment.blog.draft) {
      return res
        .status(403)
        .json({ success: false, message: "This is private blog" });
    }
    if (comment.isDeleted) {
      return res
        .status(403)
        .json({ success: false, message: "Comment does not exist" });
    }

    if (!comment.user.equals(userId)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized person to edit this comment",
      });
    }
    if (comment.comment === tobeUpdateComment.trim()) {
      return res.status(200).json({
        success: true,
        message: "No changes detected",
        comment,
      });
    }
    comment = await Comment.findByIdAndUpdate(
      commentId,
      { comment: tobeUpdateComment.trim() },
      { new: true, runValidators: true },
    );
    return res.status(200).json({
      success: true,
      message: "Comment updated successfully",
      updatedCommentValue: comment.comment,
    });
  } catch (err) {
    console.error("Error while updating comment ", err);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
}

async function likeComment(req, res) {
  try {
    const userId = req.user._id;
    const { commentId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid comment id",
      });
    }
    const comment = await Comment.findOne({
      _id: commentId,
      isDeleted: false,
    })
      .select("blog")
      .populate("blog", "draft");


    if (!comment) {
      return res
        .status(404)
        .json({ success: false, message: "Comment not found" });
    }
    if (!comment.blog) {
      return res
        .status(404)
        .json({ success: false, message: "Blog not found" });
    }
    if (comment.blog.draft) {
      return res
        .status(403)
        .json({ success: false, message: "This is private blog" });
    }

    const result = await Comment.updateOne(
      {
        _id: commentId,
        likes: userId,
      },
      { $pull: { likes: userId } },
    );

    if (result.modifiedCount === 1) {
      return res.status(200).json({
        success: true,
        action: "unlike",
        message: "comment unlike successfully",
      });
    }
    await Comment.updateOne(
      { _id: commentId },
      { $addToSet: { likes: userId } },
    );
    return res.status(200).json({
      success: true,
      action: "like",
      message: "comment liked successfully",
    });
  } catch (err) {
    console.error("Error is like comment", err);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
}

module.exports = {
  addComment,
  deleteComment,
  editComment,
  likeComment,
  addNestedComment,
};
