import React, { useEffect } from "react";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import api from "../utils/interceptor";

function VerifyEmail() {
  const { verificationToken } = useParams();
  const navigate = useNavigate();
  useEffect(() => {
    async function emailVarification() {
      try {
        const res = await api.get(`/email-verify/${verificationToken}`);
        toast.success(res.data.message);
        navigate("/signin");
      } catch (error) {
        toast.error(error.response?.data?.message);
      }
    }
    emailVarification();
  }, [verificationToken]);
  return <div>VerifyEmail</div>;
}

export default VerifyEmail;
