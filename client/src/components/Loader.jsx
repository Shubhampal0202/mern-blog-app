import React from "react";

function Loader() {
  return (
    <div className="flex justify-center items-center py-10">
      <div className="h-10 w-10 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
    </div>
  );
}

export default Loader;
