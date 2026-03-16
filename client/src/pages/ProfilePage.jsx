import React, { useState } from "react";
import { useEffect } from "react";
import toast from "react-hot-toast";
import { Link, useLocation, useParams } from "react-router-dom";
import Blog from "../components/Blog";
import { createInitials } from "../utils/createInitials";
import { useDispatch, useSelector } from "react-redux";
import { handleApiErrors, handleAuthError } from "../utils/handleApiErrors";
import api from "../utils/interceptor";
import Loader from "../components/Loader";

function ProfilePage() {
  const { username } = useParams();
  const [userData, setUserData] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(null);
  const [modalUsers, setModalUsers] = useState([]);
  const [userBlogsData, setUserBlogsData] = useState([]);
  const [accessDenied, setAccessDenied] = useState(false);
  const user = useSelector((state) => state.auth.userAuth);
  const { token = null, userId = null } = user || {};
  const dispatch = useDispatch();
  const location = useLocation();

  async function handleFollowProfile(username, token) {
    if (!token) {
      return toast.error("Please login to follow");
    }
    try {
      const res = await api.patch(
        `user/${username}/follow`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setUserData((prev) => ({
        ...prev,
        isFollowing: !prev.isFollowing,
        followersCount: prev.isFollowing
          ? prev.followersCount - 1
          : prev.followersCount + 1,
      }));
      toast.success(res.data.message);
    } catch (err) {
      console.error(err);
      if (handleAuthError(err)) return;
      toast.error(handleApiErrors(err));
    }
  }

  async function openFollowModal(type) {
    try {
      const res = await api.get(`/user/${username}/${type}`);
      if (type === "followers") {
        setModalUsers(res.data.followers);
      } else {
        setModalUsers(res.data.following);
      }

      setModalType(type);
      setShowModal(true);
    } catch (err) {
      toast.error(handleApiErrors(err));
    }
  }
  async function fetchUser() {
    try {
      const res = await api.get(`/user/${username}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setUserData({ ...res.data.user, isFollowing: res.data.isFollowing });
    } catch (err) {
      toast.error(handleApiErrors(err));
    }
  }
  function getActiveTab(pathStr) {
    const tab = pathStr.split("/")[3] || "home";
    return tab;
  }
  async function fetchBlogs(tab) {
    setUserBlogsData([]);
    setAccessDenied(false);
    let endPoint;
    if (tab === "home") {
      endPoint = `/blogs/${username}/${tab}`;
    } else if (tab === "saved-blogs") {
      endPoint = `/blogs/${username}/${tab}`;
    } else if (tab === "liked-blogs") {
      endPoint = `/blogs/${username}/${tab}`;
    } else if (tab === "draft-blogs") {
      endPoint = `/blogs/${username}/${tab}`;
    }

    if (tab !== "home") {
      if (!token) {
        return toast.error("Please login first");
      }
      if (String(userId) !== String(userData?._id)) {
        setAccessDenied(true);
        return;
      }
    }
    try {
      const res = await api.get(endPoint, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setUserBlogsData(res.data.blogs);
    } catch (err) {
      console.error(err);
      toast.error(handleApiErrors(err));
    }
  }

  useEffect(() => {
    fetchUser();
  }, [username]);
  useEffect(() => {
    if (!userData) {
      return;
    }
    const tab = getActiveTab(location.pathname);
    fetchBlogs(tab);
  }, [location.pathname, userData]);
  if (!userData) {
    return <Loader />;
  }
  return (
    <div className="flex justify-center items-center sm:items-start flex-col-reverse sm:flex-row gap-6">
      <div className=" w-[80%] max-w-[360px] sm:w-[55%]">
        <div className="flex justify-between my-6">
          <p className="font-medium font-2xl">{userData.name}</p>
          <i className="fi fi-bs-menu-dots cursor-pointer"></i>
        </div>
        <div>
          <nav>
            <ul className="flex gap-4 overflow-x-auto whitespace-nowrap scrollbar-hide pb-2">
              <li>
                <Link
                  to={`/profile/${username}`}
                  className={
                    location.pathname == `/profile/${username}`
                      ? "border-b-2 border-slate-800 pb-1"
                      : ""
                  }
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  to={`/profile/${username}/saved-blogs`}
                  className={
                    location.pathname == `/profile/${username}/saved-blogs`
                      ? "border-b-2 border-slate-800 pb-1"
                      : ""
                  }
                >
                  {" "}
                  Saved Blogs
                </Link>
              </li>
              <li>
                <Link
                  to={`/profile/${username}/liked-blogs`}
                  className={
                    location.pathname == `/profile/${username}/liked-blogs`
                      ? "border-b-2 border-slate-800 pb-1"
                      : ""
                  }
                >
                  {" "}
                  Liked Blogs
                </Link>
              </li>
              <li>
                <Link
                  to={`/profile/${username}/draft-blogs`}
                  className={
                    location.pathname == `/profile/${username}/draft-blogs`
                      ? "border-b-2 border-slate-800 pb-1"
                      : ""
                  }
                >
                  {" "}
                  Draft Blogs
                </Link>
              </li>
            </ul>
          </nav>
        </div>
        <div className="mb-2">
          {accessDenied ? (
            <h1 className="mt-5 font-medium">You cannot view this section</h1>
          ) : userBlogsData?.length > 0 ? (
            userBlogsData.map((blog) => <Blog key={blog._id} blog={blog} />)
          ) : (
            <h1 className="mt-5 font-medium">No Data</h1>
          )}
        </div>
      </div>
      <div className="w-[60%] sm:w-[30%] h-[300px] sm:border-l pl-5 sm:h-[calc(100vh_-_60px)]">
        <div className="mt-6">
          {userData?.profilePic ? (
            <img
              src={userData?.profilePic}
              className="flex justify-center items-center w-[30px] h-[30px] rounded-full"
            />
          ) : (
            <p className="bg-black text-white h-[45px] w-[45px] rounded-full flex justify-center items-center cursor-pointer">
              {createInitials(userData?.name)}
            </p>
          )}

          <p className="mt-1 font-semibold">{userData?.name}</p>
          <p
            className="text-slate-500 mt-1 cursor-pointer"
            onClick={() => openFollowModal("followers")}
          >
            {userData?.followersCount} followers
          </p>
          <p className="text-slate-500 text-sm mt-1">{userData?.bio}</p>
          <div>
            {userId === userData?._id ? (
              <Link to={`/edit-profile`}>
                <button className="bg-green-800 text-white px-4 py-2 cursor-pointer rounded-full mt-4">
                  Edit Profile
                </button>
              </Link>
            ) : (
              <button
                onClick={() => handleFollowProfile(userData?.userName, token)}
                className="bg-green-800 text-white px-4 py-2 cursor-pointer rounded-full mt-4"
              >
                {userData?.isFollowing ? "Unfollow" : "follow"}
              </button>
            )}
          </div>
        </div>

        <div className="mt-5">
          <h2
            className="text-slate-500 mt-1 cursor-pointer"
            onClick={() => openFollowModal("following")}
          >
            {userData?.followingCount} Following
          </h2>
        </div>
      </div>
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
          <div className="bg-white w-[90%] max-w-md rounded-lg p-4 shadow-lg relative">
            {/* Header */}
            <div className="flex justify-between items-center border-b pb-2">
              <h2 className="font-semibold text-lg capitalize">{modalType}</h2>
              <button onClick={() => setShowModal(false)}>✕</button>
            </div>

            {/* List */}
            <div className="max-h-[400px] overflow-y-auto mt-3 space-y-3">
              {modalUsers.length === 0 ? (
                <p className="text-gray-500 text-center">No users</p>
              ) : (
                modalUsers.map((user) => (
                  <Link
                    key={user._id}
                    to={`/profile/@${user.userName}`}
                    onClick={() => setShowModal(false)}
                    className="flex items-center gap-3 hover:bg-gray-100 p-2 rounded"
                  >
                    <div className="bg-black text-white w-8 h-8 flex items-center justify-center rounded-full">
                      {createInitials(user.name)}
                    </div>
                    <span>{user.name}</span>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProfilePage;
