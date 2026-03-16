import React from "react";
import Blog from "./Blog";

function DisplayBlogs({ blogs, fetchBlogs, hasMore, loading }) {
  return (
    <div>
      {blogs && blogs.map((blog) => <Blog key={blog._id} blog={blog} />)}
      {hasMore && (
        <div className="text-center">
          <button
            disabled={loading}
            className="bg-green-600 px-[6px] py-[6px] rounded cursor-pointer text-white"
            onClick={fetchBlogs}
          >
            {loading ? "Wait..." : "   LoadMore"}
          </button>
        </div>
      )}
    </div>
  );
}

export default DisplayBlogs;
