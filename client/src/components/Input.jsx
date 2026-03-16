import React from "react";
import { useState } from "react";

function Input({ type, placeholder, field, setUserData, icon, value }) {
  const [showPassword, setShowPassword] = useState(false);
  return (
    <div className="relative">
      <i
        className={`fi ${icon} text-white absolute top-1/2 -translate-y-1/2 mt-[2px] pl-1 opacity-50`}
      ></i>
      <input
        value={value}
        className="border py-2 px-6 rounded my-2 focus:outline-none w-[100%] bg-slate-600 text-white"
        type={type == "password" ? (showPassword ? "text" : type) : type}
        placeholder={placeholder}
        onChange={(e) =>
          setUserData((prev) => ({ ...prev, [field]: e.target.value }))
        }
      />
      {type == "password" && (
        <i
          onClick={() => setShowPassword(!showPassword)}
          className={`fi ${
            showPassword ? "fi-rr-eye" : "fi-rr-eye-crossed"
          } absolute top-1/2 right-2 -translate-y-1/2 text-white opacity-50  mt-[2px] cursor-pointer`}
        ></i>
      )}
    </div>
  );
}

export default Input;
