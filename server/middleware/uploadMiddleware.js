const upload = require("../utils/multer");
const multer = require("multer");
const uploadMiddleware = (fileName) => {
 return (req, res, next) => {
    upload.single(fileName)(req, res, (err) => {
      if (!err) {
        return next();
      }
      if (err) {
        let message = err.message;
        if (err instanceof multer.MulterError) {
          if (err.code === "LIMIT_FILE_SIZE") {
            message = "File size more than 2 MB is not allowed";
            return res.status(400).json({ success: false, message });
          } else if (err.code === "LIMIT_UNEXPECTED_FILE") {
            message = "Invalid file field name";
            return res.status(400).json({ success: false, message });
          }
        }

        return res.status(400).json({ success: false, message });
      }
    });
  };
};

module.exports = uploadMiddleware;
