import React, { useEffect } from "react";
import { useState } from "react";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import { handleApiErrors, handleAuthError } from "../utils/handleApiErrors";
import api from "../utils/interceptor";

function AddBlog() {
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [blogData, setBlogData] = useState({
    title: "",
    description: "",
    draft: false,
    image: null,
    tags: [],
  });
  const [initialBlogData, setInitialBlogData] = useState({
    title: "",
    description: "",
    draft: false,
    image: null,
    tags: [],
  });

  const isDisable =
    blogData.title === initialBlogData.title &&
    blogData.description === initialBlogData.description &&
    blogData.draft === initialBlogData.draft &&
    !(blogData.image instanceof File) &&
    blogData.tags.length === initialBlogData.tags.length &&
    [...blogData.tags]
      .sort()
      .every((tag, i) => tag === [...initialBlogData.tags].sort()[i]);

  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const user = useSelector((state) => state.auth.userAuth);
  const { token = null } = user || {};

  useEffect(() => {
    if (preview) {
      return () => {
        URL.revokeObjectURL(preview);
      };
    }
  }, [preview]);

  async function fetchBlogData(id) {
    try {
      const res = await api.get(`/blog/${id}`);

      setBlogData((prev) => ({
        ...prev,
        title: res.data.blog.title,
        description: res.data.blog.description,
        draft: res.data.blog.draft,
        tags: res.data.blog.tags,
        image: res.data.blog.image,
      }));
      setInitialBlogData((prev) => ({
        ...prev,
        title: res.data.blog.title,
        description: res.data.blog.description,
        draft: res.data.blog.draft,
        tags: res.data.blog.tags,
        image: res.data.blog.image,
      }));
      setPreview(res.data.blog.image);
      // dispatch(addSpecificBlogData(res.data.blog));
    } catch (err) {
      console.error(err);
      if (handleAuthError(err)) return;
      toast.error(handleApiErrors(err));
    }
  }

  useEffect(() => {
    if (id) {
      fetchBlogData(id);
    }
  }, [id]);

  function handleImageChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file && !file.type.startsWith("image/")) {
      toast.error("Only images allowed");
      return;
    }
    setBlogData((prev) => ({ ...prev, image: file }));
    const previewUrl = URL.createObjectURL(file);
    setPreview(previewUrl);
  }

  async function handleUpdate(e) {
    e.preventDefault();
    if (loading) return;
    if (!token) {
      return toast.error("Please login to update blog");
    }
    setLoading(true);
    const formData = new FormData();
    formData.append("title", blogData.title);
    formData.append("description", blogData.description);
    formData.append("draft", blogData.draft);
    formData.append("tags", JSON.stringify(blogData.tags));
    if (blogData.image instanceof File) {
      formData.append("file", blogData.image); // key must match backend
    }

    try {
      const res = await api.patch(`/blog/${id}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      toast.success(res.data.message);
      navigate(`/blog/${id}`);
    } catch (err) {
      console.error(err);
      if (handleAuthError(err)) return;
      toast.error(handleApiErrors(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (loading) return;
    if (!token) {
      return toast.error("Please login to create blog");
    }
    setLoading(true);
    const formData = new FormData();
    formData.append("title", blogData.title);
    formData.append("description", blogData.description);
    formData.append("draft", blogData.draft);
    formData.append("tags", JSON.stringify(blogData.tags));
    if (blogData.image) {
      formData.append("file", blogData.image); // key must match backend
    }

    try {
      const res = await api.post(`/blog`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      toast.success(res.data.message);
      navigate("/");
    } catch (err) {
      if (handleAuthError(err)) return;
      toast.error(handleApiErrors(err));
    } finally {
      setLoading(false);
    }
  }

  function handleDeleteTag(index) {
    const updatedBlogData = blogData.tags.filter((_, idx) => index != idx);
    setBlogData((prev) => ({ ...prev, tags: updatedBlogData }));
  }

  function handleKeyDown(e) {
    if (e.code == "Space") {
      e.preventDefault();
      return;
    }
    const tag = e.target.value.trim().toLowerCase();
    if (e.code == "Enter" && tag == "") {
      e.preventDefault();
      return;
    }
    if (e.code == "Enter") {
      if (blogData?.tags?.length == 10) {
        e.preventDefault();
        toast.error("Yoy can add upto 10 tags");
        e.target.value = "";
        return;
      }
      if (blogData?.tags?.includes(tag)) {
        e.preventDefault();
        toast.error("this tag already exist");
        e.target.value = "";
        return;
      }
      e.preventDefault();
      setBlogData((prev) => ({
        ...prev,
        tags: [...prev.tags, tag],
      }));
      e.target.value = "";
    }
  }

  return (
    <div className="w-[300px] sm:w-[400px] mx-auto my-8 border px-4 py-6">
      <form onSubmit={id ? handleUpdate : handleSubmit} className="w-[100%]">
        <div className="flex flex-col">
          <label htmlFor="title">Title</label>
          <input
            className="focus:outline-none border-b-2 mt-2 px-2 "
            type="text"
            id="title"
            value={blogData.title}
            onChange={(e) =>
              setBlogData((prev) => ({ ...prev, title: e.target.value }))
            }
          />
        </div>
        <div className="flex flex-col mt-4">
          <label htmlFor="description">Description</label>
          <textarea
            className="focus:outline-none border-2 mt-2 px-2 rounded"
            name=""
            id="description"
            value={blogData.description}
            onChange={(e) =>
              setBlogData((prev) => ({ ...prev, description: e.target.value }))
            }
          ></textarea>
        </div>
        <div className="mt-2">
          <div className="flex flex-col">
            <label htmlFor="tag">Tags</label>
            <input
              type="text"
              id="tag"
              placeholder="tags"
              className="focus:outline-none border-2 mt-2 px-2 py-1 rounded "
              onKeyDown={handleKeyDown}
            />
          </div>
          <div className="flex justify-between">
            <p className="text-xs opacity-60">*Click on Enter to add tag</p>
            <p className="text-xs opacity-60">
              {10 - (blogData?.tags?.length ? blogData?.tags?.length : 0)} tags
              remaining
            </p>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {blogData?.tags?.map((tag, index) => (
              <div
                key={index}
                className="flex items-center justify-center gap-1 bg-gray-200 text-[14px] rounded-full cursor-pointer px-1 hover:text-white hover:bg-blue-800"
              >
                <p>{tag}</p>
                <i
                  className="fi fi-sr-cross-circle mt-1 cursor-pointer"
                  onClick={() => handleDeleteTag(index)}
                ></i>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-4">
          <h3 className="font-semibold mb-2">Blog Type:</h3>
          <div className="flex gap-3">
            <input
              className="mt-1 cursor-pointer"
              type="radio"
              id="private"
              checked={blogData.draft === true}
              onChange={() => setBlogData((prev) => ({ ...prev, draft: true }))}
            />
            <label htmlFor="private">private</label>
          </div>
          <div className="flex gap-3">
            <input
              className="mt-1 cursor-pointer"
              type="radio"
              id="public"
              checked={blogData.draft === false}
              onChange={() =>
                setBlogData((prev) => ({ ...prev, draft: false }))
              }
            />
            <label htmlFor="public">public</label>
          </div>
        </div>
        <div className="mt-4">
          <div>
            {preview ? (
              <label htmlFor="file">
                <img
                  className="w-[100%] h-[130px] object-fill"
                  src={preview}
                  alt=""
                />
              </label>
            ) : (
              <label
                className="bg-slate-700 flex justify-center items-center text-white w-[100%] h-[170px] object-fill  cursor-pointer rounded "
                htmlFor="file"
              >
                Select File
              </label>
            )}
            <input
              className="hidden"
              type="file"
              id="file"
              onChange={handleImageChange}
            />
          </div>
        </div>

        <div id="my-editor"></div>
        <div className="mt-6 text-center">
          {loading ? (
            <div className="flex justify-center items-center ">
              <div className="h-8 w-8 border-4 rounded-full border-gray-300 border-t-blue-500 animate-spin"></div>
            </div>
          ) : (
            <button
              disabled={loading || isDisable}
              className={`px-3 py-2  rounded text-white ${
                isDisable ? "bg-slate-300" : "bg-slate-700"
              }`}
            >
              {blogData.draft ? "Save as draft" : id ? "Edit Blog" : "Add Blog"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

export default AddBlog;
