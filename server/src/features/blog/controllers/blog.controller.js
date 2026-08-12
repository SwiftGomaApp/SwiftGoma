const {
  createPost,
  updatePost,
  deletePost,
  getPostById,
  getPublishedPostBySlug,
  listPublishedPosts,
  listAllPosts,
} = require("../services/blog.service");
const { uploadImage } = require("../../../common/services/cloudinaryUpload");
const {
  CLOUDINARY_FOLDERS,
} = require("../../../common/constants/cloudinaryFolders");

function wantsCoverRemoved(value) {
  return value === true || value === "true";
}

async function uploadCoverImage(file) {
  const result = await uploadImage(file.buffer, CLOUDINARY_FOLDERS.BLOG_COVERS);
  return result.url;
}

async function getPosts(req, res, next) {
  try {
    const result = await listPublishedPosts(req.query);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function getPostBySlugHandler(req, res, next) {
  try {
    const post = await getPublishedPostBySlug(req.params.slug);
    res.status(200).json({ success: true, data: post });
  } catch (err) {
    next(err);
  }
}

async function getAdminPosts(req, res, next) {
  try {
    const result = await listAllPosts(req.query);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function getAdminPostById(req, res, next) {
  try {
    const post = await getPostById(req.params.id);
    res.status(200).json({ success: true, data: post });
  } catch (err) {
    next(err);
  }
}

async function postCreatePost(req, res, next) {
  try {
    const coverImageUrl = req.file ? await uploadCoverImage(req.file) : null;

    const post = await createPost({
      authorId: req.user.id,
      title: req.body.title,
      excerpt: req.body.excerpt,
      content: req.body.content,
      coverImageUrl,
      status: req.body.status,
    });
    res.status(201).json({ success: true, data: post });
  } catch (err) {
    next(err);
  }
}

async function putUpdatePost(req, res, next) {
  try {
    const payload = {
      title: req.body.title,
      excerpt: req.body.excerpt,
      content: req.body.content,
      status: req.body.status,
    };

    if (req.file) {
      payload.coverImageUrl = await uploadCoverImage(req.file);
    } else if (wantsCoverRemoved(req.body.removeCoverImage)) {
      payload.coverImageUrl = null;
    }

    const post = await updatePost(req.params.id, payload);
    res.status(200).json({ success: true, data: post });
  } catch (err) {
    next(err);
  }
}

async function deletePostHandler(req, res, next) {
  try {
    const result = await deletePost(req.params.id);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getPosts,
  getPostBySlugHandler,
  getAdminPosts,
  getAdminPostById,
  postCreatePost,
  putUpdatePost,
  deletePostHandler,
};
