import React from "react";
import { Link } from "react-router-dom";
// import { handleSaveBlog } from "../pages/BlogPage";
import { useSelector } from "react-redux";

function Blog({ blog }) {
  const user = useSelector((state) => state.auth.userAuth);
  const { userId = null } = user || {};
  return (
    <Link to={`/blog/${blog.blogId}`}>
      <div className="w-full  border my-6 flex sm:max-h-[200px] flex-col-reverse sm:flex-row">
        <div className="w-full sm:w-[70%] flex flex-col p-2">
          <h3 className="text-[14px]">{blog.creator.name}</h3>
          <h1 className="font-semibold">{blog.title}</h1>
          <div className="flex-1 overflow-hidden">{blog.description}</div>
          <div className="flex items-center gap-3">
            <p>{new Date(blog.createdAt).toLocaleDateString()}</p>
            <div className="flex gap-4 ">
              <div className="flex items-center gap-1 text-[18px]">
                {blog.likes.includes(userId) ? (
                  <i className="fi fi-sr-thumbs-up mt-1 cursor-pointer"></i>
                ) : (
                  <i className="fi fi-rr-social-network mt-1 cursor-pointer"></i>
                )}

                <p>{blog.likes.length}</p>
              </div>
              <div className="flex items-center gap-1 text-[16px]">
                <i className="fi fi-sr-comment-alt mt-2 cursor-pointer"></i>
                <p>{blog.commentsCount}</p>
              </div>
              <div
                className="flex items-center gap-1 text-[16px]"
                // onClick={(e) => {
                //   e.preventDefault();
                //   handleSaveBlog(userId, blog.blogId, token, dispatch);
                // }}
              >
                {blog.isSave ? (
                  <i className="fi fi-sr-bookmark mt-1 cursor-pointer"></i>
                ) : (
                  <i className="fi fi-rr-bookmark mt-1 cursor-pointer"></i>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="w-full sm:w-[30%] sm:min-w-[150px] h-[180px] sm:h-auto p-2">
          <img
            className="w-[100%] h-[100%] object-cover"
            src={blog.image}
            alt="image"
          />
        </div>
      </div>
    </Link>
  );
}

export default Blog;
