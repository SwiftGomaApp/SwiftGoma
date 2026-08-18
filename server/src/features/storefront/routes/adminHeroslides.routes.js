const express = require("express");
const { authenticate } = require("../../../common/middleware/authenticate");
const { authorize } = require("../../../common/middleware/authorize");
const {
  imageUpload,
  verifyImageContents,
} = require("../../../common/middleware/upload");
const {
  getHeroSlidesAdmin,
  postCreateHeroSlide,
  putUpdateHeroSlide,
  deleteHeroSlideHandler,
} = require("../controllers/heroslides.controller");

const AdminHeroSlideRouter = express.Router();

const heroSlideImage = [imageUpload.single("image"), verifyImageContents];

AdminHeroSlideRouter.use(authenticate);
AdminHeroSlideRouter.use(authorize("ADMIN", "SUPPORT"));

AdminHeroSlideRouter.get("/", getHeroSlidesAdmin);
AdminHeroSlideRouter.post("/", heroSlideImage, postCreateHeroSlide);
AdminHeroSlideRouter.put("/:id", heroSlideImage, putUpdateHeroSlide);
AdminHeroSlideRouter.delete("/:id", deleteHeroSlideHandler);

module.exports = AdminHeroSlideRouter;
