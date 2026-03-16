require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const connectDb = require("./config/dbConnect");
const userRouter = require("./routes/userRoute");
const blogRouter = require("./routes/blogRoute");
const cloudinary = require("./config/cloudinaryConfig");
const { apiLimiter } = require("./middleware/rateLimiter");
require("./cron");
app.use(cors());

const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// API rate limiter
app.use("/api/v1", apiLimiter);

// routes
app.use("/api/v1", userRouter);
app.use("/api/v1", blogRouter);
app.use((req, res) => {
  return res
    .status(404)
    .json({ success: false, message: "API route is not found" });
});

connectDb()
  .then(() => {
    console.log("database connected successfully");
    app.listen(PORT, async () => {
      console.log(`Server is running at Port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Error ", err.message);
  });
