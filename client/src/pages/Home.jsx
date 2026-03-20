import React from "react";
import { useEffect, useState } from "react";
import DisplayBlogs from "../components/DisplayBlogs";
import { Link } from "react-router-dom";
import { handleApiErrors } from "../utils/handleApiErrors";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import api from "../utils/interceptor";
import Loader from "../components/Loader";

function Home() {
  const [blogs, setBlogs] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const user = useSelector((state) => state.auth.userAuth);
  const { token = null } = user || {};
  console.log(blogs);

  async function fetchBlogs() {
    if (loading || !hasMore) return;
    setLoading(true);
    const params = { cursor, limit: 2 };
    try {
      const res = await api.get(`/blog`, {
        params,
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });

      setBlogs((prev) => {
        const blogsIds = prev.map((blog) => blog._id.toString());
        const newBlogs = res.data.blogs.filter(
          (blog) => !blogsIds.includes(blog._id.toString()),
        );
        return [...prev, ...newBlogs];
      });
      setHasMore(res.data.hasMore);
      setCursor(res.data.nextCursor);
    } catch (err) {
      toast.error(handleApiErrors(err));
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    fetchBlogs();
  }, []);
  if (loading) {
    return <Loader />;
  }
  return (
    <div>
      {blogs.length > 0 ? (
        <div className="flex flex-col-reverse items-center sm:items-start sm:flex-row justify-center py-6">
          <div className="w-[70%] max-w-[340px]  sm:w-[60%] sm:max-w-none">
            <DisplayBlogs
              blogs={blogs}
              fetchBlogs={fetchBlogs}
              hasMore={hasMore}
              loading={loading}
            />
          </div>
          <div className="w-[70%] max-w-[340px] sm:w-[30%] ml-4 mt-3">
            <h1 className="mb-2">Recommended Topics</h1>
            <div className="flex flex-wrap gap-2">
              {["React", "Node Js", "Mern", "dsa", "JavaScript", "MongoDB"].map(
                (tag, index) => (
                  <Link to={`/tag/${tag}`} key={index}>
                    <div
                      key={index}
                      className="bg-gray-200 text-[14px] rounded-full cursor-pointer px-1 hover:text-white hover:bg-blue-800"
                    >
                      <p className="mx-2 my-1">{tag}</p>
                    </div>
                  </Link>
                ),
              )}
            </div>
          </div>
        </div>
      ) : (
        <h1 className="text-center pt-5 font-semibold">No Blogs</h1>
      )}
    </div>
  );
}

export default Home;
