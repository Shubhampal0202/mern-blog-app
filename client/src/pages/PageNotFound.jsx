import React from "react";
import { Link } from "react-router-dom";

function PageNotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white px-4">
      <h1 className="text-7xl font-bold text-slate-300">404</h1>

      <p className="text-2xl mt-4 font-semibold">Page Not Found</p>

      <p className="text-slate-400 mt-2 text-center max-w-md">
        Sorry, the page you are looking for does not exist or has been moved.
      </p>

      <Link
        to="/"
        className="mt-6 px-6 py-2 rounded bg-slate-600 hover:bg-slate-500 transition duration-300"
      >
        Go Back Home
      </Link>
    </div>
  );
}

export default PageNotFound;
