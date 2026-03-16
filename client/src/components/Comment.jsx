import React from "react";
import { useDispatch, useSelector } from "react-redux";
// import { setIsOpen } from "../utils/commentSlice";
import { useState } from "react";
import { useParams } from "react-router-dom";
import { handleApiErrors, handleAuthError } from "../utils/handleApiErrors";
// import { addCommentInBlog } from "../utils/specificBlogDataSlice";
import CommentCards from "./CommentCards";
import api from "../utils/interceptor";
import toast from "react-hot-toast";

function Comment({ blogData, setIsOpen, setBlogData }) {
  const [comment, setComment] = useState("");
  const [activeReply, setActiveReply] = useState(null);
  const [commentPopup, setCommentPopup] = useState(null);
  const [currentEditComment, setCurrentEditComment] = useState(null);
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.userAuth);
  const { token = null } = user || {};
  const { blogId } = useParams();


  async function AddComment() {
    if (!token) {
      return toast.error("Please login to comment this blog");
    }
    if (!comment.trim()) {
      return toast.error("comment can't be empty");
    }
    try {
      const res = await api.post(
        `/blog/${blogId}/comment`,
        { comment },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      setBlogData((prev) => ({
        ...prev,
        comments: [...prev.comments, res.data.comment],
        commentsCount: prev.commentsCount + 1,
      }));

      setComment("");
    } catch (err) {
      console.error(err);
      if (handleAuthError(err)) return;
      toast.error(handleApiErrors(err));
    }
  }

  return (
    <div className="bg-white h-[calc(100vh-3rem)] fixed top-12 right-0 w-[280px] border drop-shadow-lg flex flex-col">
      <div className="flex justify-between items-center px-6 py-4 border-b bg-white z-10 shrink-0">
        <h1 className="text-xl font-semibold">{`Comments (${blogData.commentsCount})`}</h1>
        <i
          className="fi fi-rr-cross-small text-2xl cursor-pointer"
          onClick={() => dispatch(setIsOpen(false))}
        ></i>
      </div>
      <div className="mx-2 py-2 border-b bg-white shrink-0">
        <textarea
          className="focus:outline-none w-full text-lg drop-shadow p-3 resize-none h-[80px] overflow-y-auto"
          type="text"
          placeholder="write..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        ></textarea>
        <button
          className="mt-2 px-2 py-1 bg-blue-700 text-white rounded"
          onClick={AddComment}
        >
          Add
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        <CommentCards
          comments={blogData.comments}
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
    </div>
  );
}

export default Comment;
