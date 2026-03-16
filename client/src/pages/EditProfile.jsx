import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { signin } from "../utils/store/slices/authSlice";
import { useNavigate } from "react-router-dom";
import { handleApiErrors } from "../utils/handleApiErrors";
import api from "../utils/interceptor";


function EditProfile() {
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const user = useSelector((state) => state.auth.userAuth);
  const {
    token = null,
    userId = null,
    profilePic,
    bio,
    name,
    userName,
  } = user || {};

  const [userData, setUserData] = useState({
    name: name,
    userName: userName,
    profilePic: profilePic,
    bio: bio,
  });
  const [initialData, setInitialData] = useState({
    name: name,
    userName: userName,
    profilePic: profilePic,
    bio: bio,
  });

  const isDisable =
    userData.name === initialData.name &&
    userData.userName === initialData.userName &&
    userData.bio === initialData.bio &&
    !(userData.profilePic instanceof File);

  useEffect(() => {
    const data = { name, userName, profilePic, bio };
    setUserData(data);
    setInitialData(data);
  }, []);

  function handleChange(e) {
    const files = e.target.files;
    if (files) {
      setUserData((prevData) => ({
        ...prevData,
        [e.target.name]: files[0],
      }));
    } else {
      setUserData((prevData) => ({
        ...prevData,
        [e.target.name]: e.target.value,
      }));
    }
  }
  async function handleUpdate() {
    setLoading(true);
    const formData = new FormData();
    formData.append("name", userData.name);
    formData.append("userName", userData.userName);
    formData.append("bio", userData.bio);
    if (userData.profilePic instanceof File) {
      formData.append("profilePic", userData.profilePic);
    }
    try {
      const res = await api.patch(`/user/${userId}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      toast.success(res.data.message);
      dispatch(signin({ ...res.data.user, token, userId }));
      // navigate(`/profile/@${res.data.user.userName}`)
      const updatedData = {
        name: res.data.user.name,
        userName: res.data.user.userName,
        profilePic: res.data.user.profilePic,
        bio: res.data.user.bio,
      };

      setUserData(updatedData);
      setInitialData(updatedData);
    } catch (err) {
      toast.error(handleApiErrors(err));
    } finally {
      setLoading(false);
    }
  }
  return (
    <div>
      <div className="w-[290px] sm:w-[400px] mx-auto mt-4">
        <h1 className="text-center font-bold text-2xl">Edit Profile</h1>
        <div>
          <div>
            <h2 className="font-semibold">Photo</h2>
            {!userData.profilePic ? (
              <label
                htmlFor="profilepic"
                className="mr-4  inline-block w-[110px] h-[110px] border-[2px]  border-dotted rounded-full flex justify-center items-center cursor-pointer"
              >
                Select Image
              </label>
            ) : (
              <label
                htmlFor="profilepic"
                className="border-[2px] border-dotted inline-block w-[110px] h-[110px] flex justify-center items-center rounded-full "
              >
                <img
                  className="w-[110px] h-[110px] rounded-full"
                  src={
                    typeof userData.profilePic == "string"
                      ? userData.profilePic
                      : URL.createObjectURL(userData?.profilePic)
                  }
                  alt=""
                />
              </label>
            )}
            <input
              type="file"
              id="profilepic"
              name="profilePic"
              className="hidden"
              onChange={handleChange}
            />
          </div>
          <div className="flex flex-col mb-2">
            <label htmlFor="name" className="font-semibold">
              Name
            </label>
            <input
              value={userData.name}
              name="name"
              type="text"
              placeholder="name"
              id="name"
              className="outline-none border-[2px] rounded-md px-2 py-1"
              onChange={handleChange}
            />
          </div>
          <div className="flex flex-col mb-2 ">
            <label htmlFor="username" className="font-semibold">
              UserName
            </label>
            <input
              value={userData.userName}
              name="userName"
              type="text"
              placeholder="username"
              id="username"
              className="outline-none  border-[2px] rounded-md px-2 py-1"
              onChange={handleChange}
            />
          </div>
          <div className="flex flex-col mb-2 ">
            <label htmlFor="bio" className="font-semibold">
              Bio
            </label>
            <textarea
              value={userData.bio}
              name="bio"
              id="bio"
              placeholder="bio"
              className="outline-none  border-[2px] rounded-md px-2 py-1"
              onChange={handleChange}
            ></textarea>
          </div>
        </div>
        {loading ? (
          <div class="flex items-center">
            <div class="h-8 w-8 border-4 rounded-full border-gray-300 border-t-blue-500 animate-spin"></div>
          </div>
        ) : (
          <button
            disabled={isDisable}
            className={`px-3 py-1 text-white rounded text-[16px] ${
              isDisable ? "bg-green-300" : "bg-green-600"
            }`}
            onClick={handleUpdate}
          >
            Update
          </button>
        )}
      </div>
    </div>
  );
}

export default EditProfile;
