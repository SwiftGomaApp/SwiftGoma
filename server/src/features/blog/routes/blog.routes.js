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
const {
  imageUpload,
  verifyImageContents,
} = require("../../../common/middleware/upload");

const BlogRouter = express.Router();

const coverImageUpload = [
  imageUpload.single("coverImage"),
  verifyImageContents,
];

BlogRouter.get("/", getPosts);
BlogRouter.get("/slug/:slug", getPostBySlugHandler);

BlogRouter.use(authenticate, authorize("ADMIN", "SUPPORT"));

BlogRouter.get("/admin", getAdminPosts);
BlogRouter.get("/admin/:id", getAdminPostById);
BlogRouter.post("/", ...coverImageUpload, postCreatePost);
BlogRouter.put("/:id", ...coverImageUpload, putUpdatePost);
BlogRouter.delete("/:id", deletePostHandler);

module.exports = BlogRouter;
