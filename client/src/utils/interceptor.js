import axios from "axios";
const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const code = error.response?.data?.code;

    if (status === 401) {
      if (code === "TOKEN_EXPIRED" || code === "INVALID_TOKEN") {
        localStorage.removeItem("user");
        error.isAuthError = true;
      }
    }

    return Promise.reject(error);
  },
);

export default api;
