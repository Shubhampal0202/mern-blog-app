import React, { useState } from "react";
import toast from "react-hot-toast";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { signin } from "../utils/store/slices/authSlice";
import Input from "../components/Input";
import { useEffect } from "react";
import { handleApiErrors } from "../utils/handleApiErrors";
import api from "../utils/interceptor";

function AuthForm({ type }) {
  const [userData, setUserData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.userAuth);
  const { token = null } = user || {};

  useEffect(() => {
    setUserData({
      name: "",
      email: "",
      password: "",
    });
  }, [type]);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await api.post(`/user/${type}`, userData);
      if (type === "signup") {
        setMessage(res.data.message);
        setUserData({ name: "", email: "", password: "" });
        setTimeout(() => navigate("/signin"), 3000);
      } else {
        toast.success(res.data.message);
        dispatch(signin({ ...res.data.user, token: res.data.token }));
        navigate("/");
      }
    } catch (err) {
      console.error(err);
      setError(handleApiErrors(err));
      setUserData((prev) => ({ ...prev, password: "" }));
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => setError(null), 5000);
    return () => clearTimeout(timer);
  }, [error]);
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(null), 3000);
    return () => clearTimeout(timer);
  }, [message]);

  if (token) {
    return <Navigate to={"/"} />;
  }

  return (
    <div className="flex flex-col w-[350px] border-2 p-4 rounded mt-[100px] mx-auto">
      <h1 className="text-4xl mb-2 text-center font-semibold">
        {type == "signup" ? "Sign Up" : "Sign In"}
      </h1>
      <form onSubmit={handleSubmit}>
        {error && <p className="text-red-500 text-center mb-2">{error}</p>}
        {message && (
          <p className="text-green-500 text-center mb-2">{message}</p>
        )}
        {type === "signup" && (
          <Input
            type="text"
            placeholder={"Enter Your Name"}
            setUserData={setUserData}
            field="name"
            icon="fi-rr-user"
            value={userData.name}
          />
        )}

        <Input
          type="email"
          placeholder={"Enter Your Email"}
          setUserData={setUserData}
          field="email"
          icon="fi-rr-envelope"
          value={userData.email}
        />

        <Input
          type="password"
          placeholder={"Enter Your Password"}
          setUserData={setUserData}
          field="password"
          icon="fi-rr-lock"
          value={userData.password}
        />

        <div className="text-center">
          <button
            disabled={loading}
            className={`border px-2 py-2 rounded my-2 w-[100px] ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-slate-600"} text-white hover:bg-slate-500 ease-in-out duration-300`}
            type="submit"
          >
            {loading ? "Please Wait" : type === "signin" ? "Sign In" : "Sign Up"}
          </button>
        </div>
      </form>

      {type == "signin" ? (
        <p>
          Don't have an account Please{" "}
          <Link to={"/signup"} className="font-semibold underline">
            Signup
          </Link>
        </p>
      ) : (
        <p>
          Already Registered{" "}
          <Link to={"/signin"} className="font-semibold underline">
            Signin
          </Link>
        </p>
      )}
    </div>
  );
}

export default AuthForm;
