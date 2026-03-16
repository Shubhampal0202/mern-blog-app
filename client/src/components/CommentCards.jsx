import React, { useState } from "react";
import { createInitials } from "../utils/createInitials";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import { handleApiErrors, handleAuthError } from "../utils/handleApiErrors";
import api from "../utils/interceptor";

function CommentCards({
  comments,
  blogData,
  setBlogData,
  activeReply,
  setActiveReply,
  commentPopup,
  setCommentPopup,
  currentEditComment,
  setCurrentEditComment,
}) {
  const [nestedCommentValue, setNestedComment] = useState("");
  const [updatedCommentValue, setUpdatedCommentValue] = useState("");
  const user = useSelector((state) => state.auth.userAuth);
  const { token = null, userId = null } = user || {};
  function toggleLikeRecursively(comments, commentId) {
    return comments.map((comment) => {
      if (comment._id.toString() === commentId.toString()) {
        return {
          ...comment,
          likes: comment.likes.some((id) => id.toString() === userId.toString())
            ? comment.likes.filter((id) => id.toString() !== userId.toString())
            : [...comment.likes, userId],
        };
      }

      if (comment.replies?.length > 0) {
        return {
          ...comment,
          replies: toggleLikeRecursively(comment.replies, commentId),
        };
      }

      return comment;
    });
  }

  async function handleCommentLike(commentId) {
    if (!token) {
      return toast.error("please login to like this comment");
    }
    try {
      const res = await api.patch(
        `/blog/like-comment/${commentId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      toast.success(res.data.message);

      setBlogData((prev) => ({
        ...prev,
        comments: toggleLikeRecursively(prev.comments, commentId),
      }));
    } catch (err) {
      console.error(err);
      if (handleAuthError(err)) return;
      toast.error(handleApiErrors(err));
    }
  }

  function handleActiveReply(id) {
    setActiveReply((prev) => (prev != id ? id : null));
  }

  async function handleNestedComment(parentCommentId) {
    if (!token) {
      return toast.error("please login to do comments");
    }
    if (!nestedCommentValue.trim()) {
      return toast.error("Reply cannot be empty");
    }

    try {
      const res = await api.post(
        `/blog/${blogData.blog.blogId}/reply/${parentCommentId}`,
        { comment: nestedCommentValue },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      toast.success(res.data.message);
      function addReplyRecursively(comments, reply) {
        return comments.map((comment) => {
          if (comment._id.toString() === parentCommentId.toString()) {
            return {
              ...comment,
              replies: [...(comment.replies || []), reply],
            };
          }
          if (comment.replies?.length > 0) {
            return {
              ...comment,
              replies: addReplyRecursively(comment.replies, reply),
            };
          }
          return comment;
        });
      }

      setBlogData((prev) => ({
        ...prev,
        commentsCount: prev.commentsCount + 1,
        comments: addReplyRecursively(prev.comments, res.data.comment),
      }));
      setActiveReply(null);
    } catch (err) {
      console.error(err);
      if (handleAuthError(err)) return;
      toast.error(handleApiErrors(err));
    }
  }

  async function handleCommentUpdate(commentId) {
    try {
      const res = await api.patch(
        `/blog/edit-comment/${commentId}`,
        { comment: updatedCommentValue },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      toast.success(res.data.message);

      setBlogData((prev) => ({
        ...prev,
        comments: prev.comments.map((comment) => {
          if (comment._id.toString() !== commentId.toString()) {
            return comment;
          } else {
            return {
              ...comment,
              comment: res.data.updatedCommentValue,
            };
          }
        }),
      }));
    } catch (err) {
      console.error(err);
      if (handleAuthError(err)) return;
      handleApiErrors(err);
    } finally {
      setUpdatedCommentValue("");
      setCurrentEditComment(null);
    }
  }
  async function handleDeleteComment(commentId) {
    if (!token) {
      return toast.error("Please login to delete this blog");
    }

    try {
      const res = await api.patch(
        `/blog/comment/${commentId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      toast.success(res.data.message);
      function deleteComment(comments, commentId) {
        const result = [];
        for (let comment of comments) {
          if (comment._id.toString() === commentId.toString()) {
            result.push(...comment.replies);
            continue;
          }
          if (comment.replies?.length > 0) {
            comment = {
              ...comment,
              replies: deleteComment(comment.replies, commentId),
            };
          }
          result.push(comment);
        }
        return result;
      }
      setBlogData((prev) => ({
        ...prev,
        commentsCount: prev.commentsCount - 1,
        comments: deleteComment(prev.comments, commentId),
      }));
    } catch (err) {
      console.error(err);
      if (handleAuthError(err)) return;
      toast.error(handleApiErrors(err));
    }
  }

  return (
    <>
      {comments.map((comment) => (
        <div key={comment._id} className="mt-4 border-l-[1px]">
          {currentEditComment == comment._id ? (
            <div className="mx-2">
              <textarea
                className="focus:outline-none w-full text-lg drop-shadow p-3 resize-none h-[150px]"
                type="text"
                placeholder="comment..."
                defaultValue={comment.comment}
                onChange={(e) => setUpdatedCommentValue(e.target.value)}
              ></textarea>
              <div className="flex gap-2">
                <button
                  className="mt-2 px-2 py-1 bg-red-700 text-white rounded"
                  onClick={() => {
                    setCurrentEditComment(null);
                  }}
                >
                  Cancel
                </button>
                <button
                  className="mt-2 px-2 py-1 bg-blue-700 text-white rounded"
                  onClick={() => handleCommentUpdate(comment._id)}
                >
                  Edit
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="mx-5 pt-5 pb-2 border-b-2 flex flex-col gap-2 ">
                <div className="flex justify-between">
                  <div className="flex gap-3">
                    <div className="bg-black text-white h-[24px] w-[24px] rounded-full flex justify-center items-center">
                      {createInitials(comment.user.name)}
                    </div>
                    <div className="-m-1">
                      <div>{comment.user.name}</div>
                      <div className="text-[12px]">
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  {(userId == comment.user._id ||
                    userId == blogData.blog.creator._id) && (
                    <div>
                      {commentPopup == comment._id ? (
                        <div className="bg-gray-100 flex flex-col gap-1 rounded">
                          <i
                            className="fi fi-rr-cross-small text-2xl cursor-pointer relative left-12"
                            onClick={() => setCommentPopup(null)}
                          ></i>
                          {userId == comment.user._id && (
                            <div
                              className="hover:bg-blue-100 cursor-pointer px-4 pt-1 rounded "
                              onClick={() => {
                                setCurrentEditComment(comment._id);
                                setCommentPopup(null);
                              }}
                            >
                              edit
                            </div>
                          )}

                          <div
                            className="hover:bg-blue-100 cursor-pointer px-4 pb-1 rounded"
                            onClick={() => handleDeleteComment(comment._id)}
                          >
                            delete
                          </div>
                        </div>
                      ) : (
                        <i
                          className="fi fi-bs-menu-dots cursor-pointer"
                          onClick={() => setCommentPopup(comment._id)}
                        ></i>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex-1">{comment.comment}</div>
                <div className="flex justify-between items-center">
                  <div className="flex gap-2">
                    <div className="flex items-center gap-1 text-xl">
                      {comment.likes.includes(userId) ? (
                        <i
                          className="fi fi-sr-thumbs-up mt-1 cursor-pointer text-[16px]"
                          onClick={() => handleCommentLike(comment._id)}
                        ></i>
                      ) : (
                        <i
                          className="fi fi-rr-social-network mt-1 cursor-pointer text-[16px]"
                          onClick={() => handleCommentLike(comment._id)}
                        ></i>
                      )}

                      <p className="text-[14px]">{comment.likes.length}</p>
                    </div>
                    <div className="flex items-center gap-1 text-xl">
                      <i className="fi fi-sr-comment-alt mt-2 cursor-pointer text-[14px]"></i>
                      <p className="text-[14px]">{comment.replies.length}</p>
                    </div>
                  </div>
                  <div>
                    <p
                      className="cursor-pointer hover:underline"
                      onClick={() => handleActiveReply(comment._id)}
                    >
                      reply
                    </p>
                  </div>
                </div>
              </div>
              {activeReply?.toString() === comment._id.toString() && (
                <div className="mx-2">
                  <textarea
                    className="focus:outline-none w-full text-lg drop-shadow p-3 resize-none h-[80px]"
                    type="text"
                    placeholder="reply..."
                    value={nestedCommentValue}
                    onChange={(e) => setNestedComment(e.target.value)}
                  ></textarea>
                  <button
                    className="mt-2 px-2 py-1 bg-blue-700 text-white rounded"
                    onClick={() => handleNestedComment(comment._id)}
                  >
                    Add
                  </button>
                </div>
              )}
            </>
          )}
          {comment.replies.length > 0 && (
            <div className="pl-6">
              <CommentCards
                comments={comment.replies}
                blogData={blogData}
                setBlogData={setBlogData}
                activeReply={activeReply}
                setActiveReply={setActiveReply}
                commentPopup={commentPopup}
                setCommentPopup={setCommentPopup}
                currentEditComment={currentEditComment}
                setCurrentEditComment={setCurrentEditComment}
              />
            </div>
          )}
        </div>
      ))}
    </>
  );
}

export default CommentCards;
