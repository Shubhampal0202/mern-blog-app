import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import DisplayBlogs from "./DisplayBlogs";
import toast from "react-hot-toast";
import api from "../utils/interceptor";
import { handleApiErrors } from "../utils/handleApiErrors";
import { useSelector } from "react-redux";
import Loader from "./Loader";

function SearchBlog() {
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState(null);
  const [searchblogs, setSearchBlogs] = useState([]);
  const [searchParams] = useSearchParams();
  const { tag } = useParams();
  const navigate = useNavigate();

  const searchQuery = searchParams.get("q");
  const user = useSelector((state) => state.auth.userAuth);
  const { token = null } = user || {};

  async function fetchSearchedblogs(query) {
    if (loading || !hasMore) return;
    setLoading(true);
    const params = { cursor, limit: 2, ...query };
    try {
      const res = await api.get(`/blog`, {
        params,
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });
      setSearchBlogs((prev) => {
        const blogsIds = prev.map((blog) => blog._id.toString());
        const newBlogs = res.data.blogs.filter(
          (blog) => !blogsIds.includes(blog._id.toString()),
        );
        return [...prev, ...newBlogs];
      });
      setHasMore(res.data.hasMore);
      setCursor(res.data.nextCursor);
    } catch (err) {
      console.error(err);
      toast.error(handleApiErrors(err));
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setSearchBlogs([]);
    setCursor(null);
    setHasMore(true);
    if (!tag && !searchQuery) return;
    const query = tag
      ? { tag: tag.toLowerCase().replace(" ", "-") }
      : { search: searchQuery };
    if (query) {
      fetchSearchedblogs(query);
    }
  }, [tag, searchQuery]);
  if (loading) {
    return <Loader />;
  }

  return (
    <div className="py-6 w-[65%] mx-auto">
      {searchblogs && searchblogs.length == 0 ? (
        <h1 className="ml-2 text-xl sm:text-3xl text-gray-500 font-medium">
          No Blogs for{" "}
          <span className="text-black">{tag ? tag : searchQuery}</span>
          <button
            className="block bg-green-600 px-[6px] py-[2px] rounded cursor-pointer text-xl text-white mt-2 font-normal"
            onClick={() => navigate(-1)}
          >
            back
          </button>
        </h1>
      ) : (
        <h1 className="ml-2 text-xl sm:text-3xl text-gray-500 font-medium">
          Search for{" "}
          <span className="text-black">{tag ? tag : searchQuery}</span>
        </h1>
      )}

      <DisplayBlogs
        blogs={searchblogs}
        fetchBlogs={fetchSearchedblogs}
        loading={loading}
        hasMore={hasMore}
      />
    </div>
  );
}

export default SearchBlog;
