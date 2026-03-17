# MERN Blog Platform

A full-stack blogging platform built using the MERN stack where users can create, read, update, and delete blogs. The application supports user authentication, image uploads, comments, and secure API access.

This project demonstrates modern full-stack development practices including REST APIs, authentication, cloud storage integration, and frontend state management.

## 🌐 Live Demo

🚀 **Frontend (Vercel):**  
👉 [https://mern-blog-app-rho-two.vercel.app](https://mern-blog-app-rho-two.vercel.app)

⚙️ **Backend (Render):**  
👉 https://mern-blog-app-0ply.onrender.com

---

## Tech Stack

### Frontend

- React
- Redux Toolkit
- Axios
- React Router
- Tailwind CSS

### Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT Authentication
- Multer
- Cloudinary
- Express Rate Limit
- Cron Jobs

---

## Features

### Authentication

- User registration
- Secure login using JWT
- Protected routes
- Authentication middleware

### Blog Management

- Create blog posts
- Edit blog posts
- Delete blog posts
- View all blogs
- View single blog

### Media Upload

- Image upload using Multer
- Image storage using Cloudinary

### Comment System

- Add comments and nested comments to blogs
- View blog comments

### Security

- API rate limiting
- Input validation
- Protected API routes

### Additional Features

- Axios interceptors for API error handling
- Redux state management
- Cron jobs for background tasks

## 📁 Project Structure

```
mern-blog-app/
│
├── client/                # React frontend
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── utils/
│   │   └── redux/
│   ├── public/
│   ├── package.json
│   └── vercel.json
│
├── server/                # Node.js backend
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   ├── config/
│   ├── utils/
│   ├── server.js
│   └── package.json
│
└── README.md
```

## Installation

Clone the repository

```bash
git clone https://github.com/your-username/blog-app.git
cd blog-app
```


#### Backend Setup
Navigate to the server directory:

```cd server
npm install
npm run dev
Server will run on:
http://localhost:3000
```

#### Frontend Setup
Open a new terminal and navigate to the client directory:

```cd client
npm install
npm run dev
Frontend will run on:
http://localhost:5173
```

### Backend Environment Variables

Create a `.env` file inside the **server** folder and add the following:

```env
PORT=3000
DB_URL=your_mongodb_connection_string
JWT_SECRET=your_secret_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
EMAIL_USER=your_email
EMAIL_PASS=your_email_password
```

#### Frontend Environment Variables

Create a `.env` file inside the **client** folder and add the following:
VITE_BACKEND_URL=http://localhost:3000/api/v1

### API Rate Limiting

The backend uses rate limiting middleware to protect APIs from abuse.

Example configuration:

- Global API limit: **200 requests per 15 minutes**
- Authentication limit: **10 login attempts per 15 minutes**

This helps prevent brute force attacks and excessive API usage.

### API Endpoints

#### Authentication

```
   POST /api/v1/user/signup
   POST /api/v1/user/signin
```

### Users

```
   GET /api/v1/user
   GET /api/v1/user/:username
   GET /api/v1/blogs/:username/home
   GET /api/v1/blogs/:username/saved-blogs
   GET /api/v1/blogs/:username/liked-blogs
   GET /api/v1/blogs/:username/draft-blogs
   GET /api/v1/user/:username/followers
   GET /api/v1/user/:username/following
   PATCH /api/v1/user/:userId
   DELETE /api/v1/user/:userId
   PATCH /api/v1/user/:username/follow
   GET /api/v1/email-verify/:verificationToken
```

### Blogs

```
POST /api/v1/blog
GET /api/v1/blog
GET /api/v1/blog/:blogId
PATCH /api/v1/blog/:blogId
PATCH /api/v1/blog/delete/:blogId
POST /api/v1/blog/like/:blogId
PATCH /api/v1/blog/save/:blogId
```

### Comments

```
POST /api/v1/blog/:blogId/comment
POST /api/v1/blog/:blogId/reply/:parentCommentId
PATCH /api/v1/blog/comment/:commentId
PATCH /api/v1/blog/edit-comment/:commentId
PATCH /api/v1/blog/like-comment/:commentId
```

### Future Improvements

- Notifications system
- Redis based rate limiting

### Author

**Shubham Pal**

Full Stack Developer (MERN)
Email: shubhamkumar0202@gmail.com
