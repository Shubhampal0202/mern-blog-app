import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import PageNotFound from "./pages/PageNotFound";
import AuthForm from "./pages/AuthForm";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import AddBlog from "./pages/AddBlog";
import BlogPage from "./pages/BlogPage";
import ProfilePage from "./pages/ProfilePage";
import EditProfile from "./pages/EditProfile";
import SearchBlog from "./components/SearchBlog";

function App() {
  return (
    <div>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/add-blog" element={<AddBlog />} />
          <Route path="/edit/:id" element={<AddBlog />} />
          <Route path="/profile/:username" element={<ProfilePage />} />
          <Route
            path="/profile/:username/saved-blogs"
            element={<ProfilePage />}
          />
          <Route
            path="/profile/:username/liked-blogs"
            element={<ProfilePage />}
          />
          <Route
            path="/profile/:username/draft-blogs"
            element={<ProfilePage />}
          />
          <Route path="/edit-profile" element={<EditProfile />} />
        </Route>

        <Route path="/signup" element={<AuthForm type={"signup"} />} />
        <Route path="/signin" element={<AuthForm type={"signin"} />} />
        <Route path="blog/:blogId" element={<BlogPage />} />
        <Route path="/search" element={<SearchBlog />} />
        <Route path="/tag/:tag" element={<SearchBlog />} />
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </div>
  );
}

export default App;
