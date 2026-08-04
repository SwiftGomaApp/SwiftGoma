const express = require("express");
const {
  getPosts,
  getPostBySlugHandler,
  getAdminPosts,
  getAdminPostById,
  postCreatePost,
  putUpdatePost,
  deletePostHandler,
} = require("../controllers/blog.controller");
const { authenticate } = require("../../../common/middleware/authenticate");
const { authorize } = require("../../../common/middleware/authorize");

const BlogRouter = express.Router();

// -----------------------------
// PUBLIC
// -----------------------------
BlogRouter.get("/", getPosts);
BlogRouter.get("/slug/:slug", getPostBySlugHandler);

// -----------------------------
// ADMIN
// -----------------------------
BlogRouter.use(authenticate, authorize("ADMIN", "SUPPORT"));

BlogRouter.get("/admin", getAdminPosts);
BlogRouter.get("/admin/:id", getAdminPostById);
BlogRouter.post("/", postCreatePost);
BlogRouter.put("/:id", putUpdatePost);
BlogRouter.delete("/:id", deletePostHandler);

module.exports = BlogRouter;
