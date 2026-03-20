import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../utils/interceptor";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import Comment from "../components/Comment";
import { createInitials } from "../utils/createInitials";
import { handleApiErrors, handleAuthError } from "../utils/handleApiErrors";
import Loader from "../components/Loader";

async function handleSaveBlog(blogId, token, setBlogData) {
  if (!token) {
    return toast.error("Please login to save this blog");
  }

  try {
    const res = await api.patch(
      `/blog/save/${blogId}`,
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
      isSave: !prev.isSave,
    }));
  } catch (err) {
    console.error(err);
    if (handleAuthError(err)) return;
    toast.error(handleApiErrors(err));
  }
}

export async function handleFollowCreator(
  blogCreatorUserName,
  token,
  setBlogData,
  userId,
  blogData,
) {
  if (!token) {
    return toast.error("Please login to follow");
  }
  try {
    const res = await api.patch(
      `/user/${blogCreatorUserName}/follow`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    toast.success(res.data.message);
    const alreadyFollowing = blogData.blog.creator.followers.some(
      (id) => id.toString() === userId?.toString(),
    );
    if (alreadyFollowing) {
      setBlogData((prev) => ({
        ...prev,
        blog: {
          ...prev.blog,
          creator: {
            ...prev.blog.creator,
            followers: prev.blog.creator.followers.filter(
              (id) => id.toString() !== userId?.toString(),
            ),
          },
        },
      }));
    } else {
      setBlogData((prev) => ({
        ...prev,
        blog: {
          ...prev.blog,
          creator: {
            ...prev.blog.creator,
            followers: [...prev.blog.creator.followers, userId],
          },
        },
      }));
    }
  } catch (err) {
    console.error(err);
    if (handleAuthError(err)) return;
    toast.error(handleApiErrors(err));
  }
}

function BlogPage() {
  const [blogData, setBlogData] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

  const { blogId } = useParams();
  const user = useSelector((state) => state.auth.userAuth);
  const { token = null, userId = null } = user || {};
  const navigate = useNavigate();

  async function fetchBlogData() {
    try {
      const res = await api.get(`/blog/${blogId}`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });

      setBlogData({
        blog: res.data.blog,
        comments: res.data.comments,
        commentsCount: res.data.commentsCount,
        isSave: res.data.isSave,
      });
    } catch (err) {
      toast.error(handleApiErrors(err));
    }
  }

  async function handleLike() {
    if (!token) {
      return toast.error("Please login to like this blog");
    }

    try {
      const res = await api.post(
        `/blog/like/${blogId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      toast.success(res.data.message);
      const existLikeUserId = blogData.blog.likes.some(
        (id) => id.toString() === userId?.toString(),
      );
      if (existLikeUserId) {
        setBlogData((prev) => ({
          ...prev,
          blog: {
            ...prev.blog,
            likes: prev.blog.likes.filter(
              (id) => id.toString() !== userId?.toString(),
            ),
          },
        }));
      } else {
        setBlogData((prev) => ({
          ...prev,
          blog: { ...prev.blog, likes: [...prev.blog.likes, userId] },
        }));
      }
    } catch (err) {
      console.error(err);
      if (handleAuthError(err)) return;
      toast.error(handleApiErrors(err));
    }
  }
  async function handleDelete(blogId) {
    if (!token) return toast.error("Login required");

    try {
      const res = await api.patch(
        `/blog/delete/${blogId}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      toast.success(res.data.message);
      navigate("/");
    } catch (err) {
      toast.error(handleApiErrors(err));
    }
  }

  useEffect(() => {
    fetchBlogData();
  }, [blogId]);

  if (!blogData) return <Loader />;

  return (
    <div className="w-[60%] sm:w-[40%] mx-auto my-6 relative">
      <h1 className="font-semibold text-5xl mb-2">{blogData.blog.title}</h1>
      <div className="flex my-4 gap-4 items-center">
        <Link to={`/profile/@${blogData.blog.creator.userName}`}>
          <div className="bg-black text-white h-[24px] w-[24px] rounded-full flex justify-center items-center cursor-pointer">
            {createInitials(blogData.blog.creator.name)}
          </div>
        </Link>
        <div>
          <div className="flex  gap-1 items-center sm-gap-2">
            <Link to={`/profile/@${blogData.blog.creator.userName}`}>
              <p className="cursor-pointer hover:underline">
                {blogData.blog.creator.name}
              </p>
            </Link>
            <p
              onClick={() =>
                handleFollowCreator(
                  blogData.blog.creator.userName,
                  token,
                  setBlogData,
                  userId,
                  blogData,
                )
              }
              className="cursor-pointer text-green-800 font-medium"
            >
              {blogData.blog.creator.followers.some(
                (id) => id.toString() === userId?.toString(),
              )
                ? "following"
                : "follow"}
            </p>
          </div>
          <div className="flex gap-2">
            <p>6 min ago</p>
            <p>{new Date(blogData.blog.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      <div className="h-[220px] sm:h-[300px] sm:min-w-[300px]">
        <img className="h-[100%] w-[100%]" src={blogData.blog.image} alt="" />
      </div>
      <div className="mt-4 mb-4">
        {token &&
          userId?.toString() === blogData?.blog?.creator?._id.toString() && (
            <div className="flex gap-2">
              <button className="bg-green-600 px-4 py-2 text-white rounded text-sm">
                <Link to={`/edit/${blogData.blog.blogId}`}>Edit</Link>
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  handleDelete(blogData?.blog.blogId);
                }}
                className="text-white bg-red-600 px-4 py-2 rounded text-sm"
              >
                Delete
              </button>
            </div>
          )}
      </div>
      <div className="flex gap-4 pb-4">
        <div className="flex items-center gap-1 text-2xl">
          {blogData.blog.likes.some(
            (id) => id.toString() === userId?.toString(),
          ) ? (
            <i
              className="fi fi-sr-thumbs-up mt-1 cursor-pointer"
              onClick={handleLike}
            ></i>
          ) : (
            <i
              className="fi fi-rr-social-network mt-1 cursor-pointer"
              onClick={handleLike}
            ></i>
          )}

          <p>{blogData.blog.likes.length}</p>
        </div>
        <div className="flex items-center gap-1 text-2xl">
          <i
            className="fi fi-sr-comment-alt mt-2 cursor-pointer"
            onClick={() => setIsOpen((prev) => !prev)}
          ></i>
          <p>{blogData.commentsCount}</p>
        </div>
        <div
          className="flex items-center gap-1 text-xl"
          onClick={() => {
            handleSaveBlog(blogId, token, setBlogData);
          }}
        >
          {blogData.isSave ? (
            <i className="fi fi-sr-bookmark mt-1 cursor-pointer"></i>
          ) : (
            <i className="fi fi-rr-bookmark mt-1 cursor-pointer"></i>
          )}
        </div>
      </div>

      {isOpen && (
        <Comment
          blogData={blogData}
          setIsOpen={setIsOpen}
          setBlogData={setBlogData}
        />
      )}
    </div>
  );
}

export default BlogPage;
