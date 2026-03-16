import { Link, useLocation, useNavigate } from "react-router-dom";
import logo from "../../public/logo.svg";
import { useDispatch, useSelector } from "react-redux";
import { createInitials } from "../utils/createInitials";
import { useState } from "react";
import { logout } from "../utils/store/slices/authSlice";
import { useEffect } from "react";

function Navbar() {
  const user = useSelector((state) => state.auth.userAuth);
  const {
    name = "",
    token = null,
    profilePic = null,
    userName = "",
  } = user || {};

  const [showProfilePopup, setShowProfilePopup] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const location = useLocation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    setShowProfilePopup(false);
    dispatch(logout());
    navigate("/signin");
  };

  useEffect(() => {
    if (location.pathname != "/search") {
      setSearchQuery("");
    }

    setShowProfilePopup(false);
  }, [location.pathname]);

  return (
    <div className="h-[60px] sticky top-0 z-40 bg-white border shadow-sm flex justify-between items-center">
      <div className="flex gap-4 relative ml-2">
        <Link to={"/"}>
          <img src={logo} alt="logo" />
        </Link>
        <i
          className="fi fi-rs-search text-gray-500  absolute top-2 left-[76px]"
          onClick={() => setShowMobileSearch(true)}
        ></i>
        <input
          type="text"
          placeholder="Search"
          className="hidden focus:outline-none border rounded-full px-8 sm:block"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.code == "Enter" && searchQuery.trim() != "") {
              navigate(`/search?q=${searchQuery.trim()}`);
            }
          }}
        />
        {showMobileSearch && (
          <div className="fixed inset-0 z-50 px-4 py-3 bg-white">
            <div className="flex items-center gap-2">
              <i
                className="fi fi-rr-arrow-left text-xl cursor-pointer"
                onClick={() => setShowMobileSearch(false)}
              ></i>
              <input
                type="text"
                placeholder="Search"
                autoFocus
                className="flex-1 border rounded-full px-8 py-2"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.code == "Enter" && searchQuery.trim() != "") {
                    navigate(`/search?q=${searchQuery.trim()}`);
                    setShowMobileSearch(false);
                  }
                }}
              />
            </div>
          </div>
        )}
      </div>
      <div className="flex gap-4">
        {token && (
          <div className="flex items-center cursor-pointer">
            <Link to={"/add-blog"}>
              <i className="fi fi-rr-edit mt-1"></i>
              <span>Write</span>
            </Link>
          </div>
        )}
        {token ? (
          <div
            className="mr-4 bg-black text-white h-[24px] w-[24px] rounded-full flex justify-center items-center cursor-pointer"
            onClick={() => setShowProfilePopup((prev) => !prev)}
          >
            {" "}
            {profilePic ? (
              <img
                src={profilePic}
                className="h-[24px] w-[24px] rounded-full"
              />
            ) : (
              createInitials(name)
            )}
          </div>
        ) : (
          <div className="flex gap-4 px-4">
            <Link to={"/signup"}>
              <button
                className={`${
                  location.pathname === "/signup"
                    ? "bg-blue-600 text-white"
                    : ""
                } px-4 py-2  rounded-full border`}
              >
                Singup
              </button>
            </Link>
            <Link to={"/signin"}>
              <button
                className={` ${
                  location.pathname === "/signin"
                    ? "bg-blue-600 text-white"
                    : ""
                } px-4 py-2 rounded-full border`}
              >
                Singin
              </button>
            </Link>
          </div>
        )}
      </div>
      {showProfilePopup && (
        <div className="w-[100px] bg-gray-100 absolute right-2 top-11 drop-shadow-sm rounded-sm">
          <Link to={`/profile/@${userName}`}>
            <p
              className="px-3 py-1 cursor-pointer hover:bg-black hover:text-white rounded-t-sm"
              onClick={() => setShowProfilePopup(false)}
            >
              Profile
            </p>
          </Link>

          <p
            className="px-3 py-1 cursor-pointer hover:bg-black hover:text-white rounded-b-sm mt-1"
            onClick={handleLogout}
          >
            Logout
          </p>
        </div>
      )}
    </div>
  );
}

export default Navbar;
