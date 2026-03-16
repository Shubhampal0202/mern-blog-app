const User = require("../model/userSchema");
const Blog = require("../model/blogSchema");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const {
  generateToken,
  verifyToken,
  getHashToken,
} = require("../utils/generateToken");
const transporter = require("../utils/transporter");
const ShortUniqueId = require("short-unique-id");
const cloudinary = require("../config/cloudinaryConfig");
const validator = require("validator");
const sendMails = require("../utils/sendMails");

async function createUser(req, res) {
  try {
    let { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Please Enter All Fields" });
    }
    if (!validator.isEmail(email)) {
      return res.status(400).json({
        success: false,
        message: `${email} is not a Email`,
      });
    }

    if (String(password).length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must contains atleast 6 characters",
      });
    }
    if (String(name).length < 3) {
      return res.status(400).json({
        success: false,
        message: "Name must contain atleast 3 characters",
      });
    }
    if (String(name).length > 15) {
      return res.status(400).json({
        success: false,
        message: "Name can contains atmost 15 characters",
      });
    }

    let user = await User.findOne({ email: email });

    if (user && user.isVerify) {
      return res.status(409).json({
        success: false,
        message: "You are already register please login",
      });
    }
    if (user && !user.isVerify) {
      if (user.emailVerificationExpire) {
        const resendAllowedAt =
          new Date(user.emailVerificationExpire).getTime() - 8 * 60 * 1000;
        if (resendAllowedAt > Date.now()) {
          return res.status(429).json({
            message:
              "Please wait 2 minutes before requesting another verification email",
          });
        }
      }
    }

    const { rawToken, hashToken } = getHashToken();
    const url = `http://localhost:5173/verify-email/${rawToken}`;
    if (user && !user.isVerify) {
      user.emailVerificationToken = hashToken;
      user.emailVerificationExpire = new Date(Date.now() + 10 * 60 * 1000);
      await user.save();
      sendMails(email, url).catch((err) => {
        console.error("Email Failed :", err);
      });
      return res.status(200).json({
        success: true,
        message:
          "If this email exists, please check your inbox. You can resend the verification email after 2 minutes.",
      });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const uid = new ShortUniqueId({ length: 5 });
    const uniqueId = uid.rnd();
    const userName = email.trim().split("@")[0] + uniqueId;
    await User.create({
      name,
      email,
      password: hashedPassword,
      userName,
      emailVerificationToken: hashToken,
      emailVerificationExpire: new Date(Date.now() + 10 * 60 * 1000),
    });
    sendMails(email, url).catch((err) => {
      console.error("Email Failed :", err);
    });
    return res.status(201).json({
      success: true,
      message:
        "If this email exists, please check your inbox. You can resend the verification email after 2 minutes.",
    });
  } catch (err) {
    console.error(err);
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages[0] });
    }

    if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0];

      return res.status(409).json({
        success: false,
        message: `${field} already exists`,
      });
    }

    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
}

async function userLogin(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Please Enter All The Fields" });
    }
    const userExist = await User.findOne({ email });
    if (!userExist) {
      return res.status(401).json({
        success: false,
        code: "INVALID_CREDENTIALS",
        message: "Invalid email or password",
      });
    }
    const isMatched = await bcrypt.compare(password, userExist.password);
    if (!isMatched) {
      return res.status(401).json({
        success: false,
        code: "INVALID_CREDENTIALS",
        message: "Invalid email or password",
      });
    }
    if (userExist && !userExist.isVerify) {
      if (userExist.emailVerificationExpire) {
        const resendAllowedAt =
          new Date(userExist.emailVerificationExpire).getTime() - 8 * 60 * 1000;
        if (resendAllowedAt > Date.now()) {
          return res.status(429).json({
            message:
              "Please wait 2 minutes before requesting another verification email",
          });
        }
      }
      const { rawToken, hashToken } = getHashToken();
      const url = `http://localhost:5173/verify-email/${rawToken}`;
      userExist.emailVerificationToken = hashToken;
      userExist.emailVerificationExpire = new Date(Date.now() + 10 * 60 * 1000);
      await userExist.save();
      sendMails(email, url).catch((err) => {
        console.error("Email Failed :", err);
      });
      return res.status(200).json({
        success: true,
        message:
          "Account not verified. Verification email sent. You can resend after 2 minutes.",
      });
    }

    const token = generateToken({
      email: userExist.email,
      _id: userExist._id,
    });
    return res.status(200).json({
      success: true,
      message: "User loggedIn successfully",
      token,
      user: {
        userId: userExist._id.toString(),
        name: userExist.name,
        profilePic: userExist.profilePic,
        userName: userExist.userName,
        bio: userExist.bio,
      },
    });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
}

async function getAllUsers(req, res) {
  try {
    let users = await User.find({ isVerify: true });
    return res.status(200).json({ users });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
}
async function getUserBlogs(req, res) {
  let { username } = req.params;
  username = username.startsWith("@") ? username.split("@")[1] : username;
  try {
    const profileUser = await User.findOne({
      userName: username,
      isVerify: true,
    });
    if (!profileUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    const blogs = await Blog.find({
      creator: profileUser._id,
      isDeleted: false,
      draft: false,
    })
      .sort({ createdAt: -1 })
      .populate({
        path: "creator",
        select: "name email userName",
      })
      .lean();
    return res.status(200).json({
      success: true,
      blogs,
    });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
}
async function getUserSavedBlogs(req, res) {
  let { username } = req.params;
  username = username.startsWith("@") ? username.split("@")[1] : username;
  const { _id: loggedInUserId } = req.user;
  try {
    const profileUser = await User.findOne({
      userName: username,
      isVerify: true,
    });

    if (!profileUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    if (loggedInUserId.toString() !== profileUser._id.toString()) {
      return res
        .status(403)
        .json({ success: false, message: "You are not allowed to view" });
    }
    const blogs = await Blog.find({
      _id: { $in: profileUser.saveBlogs },
      isDeleted: false,
      draft: false,
    })
      .populate({ path: "creator", select: "name email userName" })
      .lean();
    return res.status(200).json({ success: true, blogs });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
}
async function getUserLikedBlogs(req, res) {
  let { username } = req.params;
  username = username.startsWith("@") ? username.split("@")[1] : username;
  const { _id: loggedInUserId } = req.user;
  try {
    const profileUser = await User.findOne({
      userName: username,
      isVerify: true,
    });
    if (!profileUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    if (loggedInUserId.toString() !== profileUser._id.toString()) {
      return res
        .status(403)
        .json({ success: false, message: "You are not allowed to view" });
    }
    const blogs = await Blog.find({
      _id: { $in: profileUser.likeBlogs },
      isDeleted: false,
      draft: false,
    })
      .populate({ path: "creator", select: "name email userName" })
      .lean();
    return res.status(200).json({ success: true, blogs });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
}
async function getUserDraftBlogs(req, res) {
  let { username } = req.params;
  username = username.startsWith("@") ? username.split("@")[1] : username;
  const { _id: loggedInUserId } = req.user;
  try {
    const profileUser = await User.findOne({
      userName: username,
      isVerify: true,
    });
    if (!profileUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    if (loggedInUserId.toString() !== profileUser._id.toString()) {
      return res
        .status(403)
        .json({ success: false, message: "You are not allowed to view" });
    }
    const blogs = await Blog.find({
      creator: profileUser._id,
      draft: true,
      isDeleted: false,
    })
      .populate({ path: "creator", select: "name email userName" })
      .lean();
    return res.status(200).json({ success: true, blogs });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
}

async function getSingleUser(req, res) {
  try {
    let { username } = req.params;
    username = username.startsWith("@") ? username.slice(1) : username;
    const userProfile = await User.findOne(
      { userName: username, isVerify: true },
      "name userName profilePic bio followers following createdAt",
    );

    if (!userProfile) {
      return res.status(404).json({ message: "User not found" });
    }
    let isFollowing = false;

    if (req.user) {
      isFollowing = userProfile.followers.some(
        (id) => id.toString() === req.user._id.toString(),
      );
    }

    return res.status(200).json({
      success: true,
      message: "User fetched successfully",
      isFollowing,
      user: {
        _id: userProfile._id.toString(),
        name: userProfile.name,
        userName: userProfile.userName,
        profilePic: userProfile.profilePic,
        bio: userProfile.bio,
        followersCount: userProfile.followers.length,
        followingCount: userProfile.following.length,
        joinedAt: userProfile.createdAt,
      },
    });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
}
async function getFollowers(req, res) {
  try {
    let { username } = req.params;
    username = username.startsWith("@") ? username.slice(1) : username;

    const user = await User.findOne({ userName: username }).populate(
      "followers",
      "name userName profilePic",
    );

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({
      success: true,
      followers: user.followers,
    });
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
}
async function getFollowing(req, res) {
  try {
    let { username } = req.params;
    username = username.startsWith("@") ? username.slice(1) : username;

    const user = await User.findOne({ userName: username }).populate(
      "following",
      "name userName profilePic",
    );

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({
      success: true,
      following: user.following,
    });
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
}

async function updateUser(req, res) {
  try {
    const loggedInUserId = req.user._id;
    const { userId } = req.params;
    let { name, userName, bio } = req.body;
    const file = req.file;
    if (name && String(name).length < 3) {
      return res.status(400).json({
        success: false,
        message: "Name must contain atleast 3 characters",
      });
    }
    if (name && String(name).length > 15) {
      return res.status(400).json({
        success: false,
        message: "Name can contains atmost 15 characters",
      });
    }

    const user = await User.findOne({ _id: userId });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    if (!loggedInUserId.equals(user._id)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized person to delete this user",
      });
    }

    let oldProfilePicId = user.profilePicId;
    let newImage;
    try {
      if (file) {
        newImage = await cloudinary.uploader.upload(
          `data:${file.mimetype};base64,${file.buffer.toString("base64")}`,
          {
            folder: "Blog-App",
          },
        );

        if (newImage) {
          user.profilePic = newImage.secure_url;
          user.profilePicId = newImage.public_id;
        }
      }

      if (userName !== undefined) user.userName = userName;
      if (name !== undefined) user.name = name;
      if (bio !== undefined) user.bio = bio;
      await user.save();
    } catch (err) {
      if (newImage) {
        await cloudinary.uploader.destroy(newImage.public_id);
      }
      throw err;
    }

    try {
      if (oldProfilePicId && newImage) {
        await cloudinary.uploader.destroy(oldProfilePicId);
      }
    } catch (err) {
      console.error("orphan image cleanup failed", err);
    }

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      user: {
        name: user.name,
        userName: user.userName,
        profilePic: user.profilePic,
        bio: user.bio,
      },
    });
  } catch (err) {
    console.error(err);
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages[0] });
    }

    if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0];

      return res.status(409).json({
        success: false,
        message: `${field} already exists`,
      });
    }
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
}

async function deleteUser(req, res) {
  try {
    const { userId: userName } = req.params;
    const loggedInUserId = req.user._id;
    const user = await User.findOne({ userName, isVerify: true });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    if (!loggedInUserId.equals(user._id)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete this user",
      });
    }
    const profileId = user.profilePicId;
    await user.deleteOne();

    if (profileId) {
      cloudinary.uploader.destroy(profileId).catch((err) => {
        console.error("orphan image cleanup failed", err);
      });
    }
    return res
      .status(200)
      .json({ success: true, message: "user deleted successfully" });
  } catch (err) {
    console.error("Error while deleting the user ", err);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}

async function followUserProfile(req, res) {
  const loggedInUserId = req.user._id;
  const { username } = req.params;
  try {
    const user = await User.findOne({ userName: username, isVerify: true });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    if (loggedInUserId.equals(user._id)) {
      return res.status(400).json({ message: "You can't follow your self" });
    }
    const result = await User.updateOne(
      { userName: username, followers: loggedInUserId },
      { $pull: { followers: loggedInUserId } },
    );

    if (result.modifiedCount === 1) {
      await User.updateOne(
        { _id: loggedInUserId },
        { $pull: { following: user._id } },
      );
      return res
        .status(200)
        .json({ success: true, message: "You unfollowed him" });
    }
    await User.updateOne(
      { userName: username },
      { $addToSet: { followers: loggedInUserId } },
    );
    await User.updateOne(
      { _id: loggedInUserId },
      { $addToSet: { following: user._id } },
    );
    return res
      .status(200)
      .json({ success: true, message: "You start following him" });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
}

async function verifyEmail(req, res) {
  try {
    const { verificationToken } = req.params;
    const hashToken = crypto
      .createHash("sha256")
      .update(verificationToken)
      .digest("hex");
    const user = await User.findOne({
      emailVerificationToken: hashToken,
      emailVerificationExpire: { $gt: new Date(Date.now()) },
    });
    if (!user) {
      return res.status(400).json({
        success: false,
        code: "INVALID_OR_EXPIRED_TOKEN",
        message: "Verification link is invalid or expired",
      });
    }
    user.isVerify = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpire = null;
    await user.save();
    return res
      .status(200)
      .json({ success: true, message: "Account verified Please login" });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
}

module.exports = {
  createUser,
  getAllUsers,
  getSingleUser,
  updateUser,
  deleteUser,
  userLogin,
  verifyEmail,
  followUserProfile,
  getFollowers,
  getFollowing,
  getUserBlogs,
  getUserSavedBlogs,
  getUserLikedBlogs,
  getUserDraftBlogs,
};
