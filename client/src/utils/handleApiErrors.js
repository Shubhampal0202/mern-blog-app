import toast from "react-hot-toast";

export function handleApiErrors(err) {
  if (err.response) {
    return (
      err.response?.data?.message ||
      `Request failed with status ${err.response?.status}`
    );
  } else if (err?.request) {
    return "Server not responding. Please try again.";
  } else {
    return "Something went wrong";
  }
}

export function handleAuthError(error) {
  if (error.isAuthError) {
    toast.error("Session expired. Please login again.");
    setTimeout(() => {
      window.location.href = "/signin";
    }, 1000);
    return true;
  }
  return false;
}
