const {
  createHeroSlide,
  updateHeroSlide,
  deleteHeroSlide,
  listHeroSlidesAdmin,
  getActiveHeroSlides,
} = require("../services/heroSlide.service");

async function getHeroSlides(req, res, next) {
  try {
    const slides = await getActiveHeroSlides();
    res.status(200).json({ success: true, data: slides });
  } catch (error) {}
}

async function getHeroSlidesAdmin(req, res, next) {
  try {
    const slides = await listHeroSlidesAdmin();
    res.status(200).json({ success: true, data: slides });
  } catch (err) {
    next(err);
  }
}

async function postCreateHeroSlide(req, res, next) {
  try {
    const slide = await createHeroSlide({
      role: req.body.role,
      title: req.body.title,
      description: req.body.description,
      searchPlaceholder: req.body.searchPlaceholder,
      productId: req.body.productId,
      sortOrder: req.body.sortOrder ? Number(req.body.sortOrder) : 0,
      imageBuffer: req.file?.buffer,
    });
    res.status(201).json({ success: true, data: slide });
  } catch (err) {
    next(err);
  }
}

async function putUpdateHeroSlide(req, res, next) {
  try {
    const slide = await updateHeroSlide(req.params.id, {
      role: req.body.role,
      title: req.body.title,
      description: req.body.description,
      searchPlaceholder: req.body.searchPlaceholder,
      productId: req.body.productId,
      sortOrder:
        req.body.sortOrder !== undefined
          ? Number(req.body.sortOrder)
          : undefined,
      isActive:
        req.body.isActive !== undefined
          ? req.body.isActive === true || req.body.isActive === "true"
          : undefined,
      imageBuffer: req.file?.buffer,
    });
    res.status(200).json({ success: true, data: slide });
  } catch (err) {
    next(err);
  }
}

async function deleteHeroSlideHandler(req, res, next) {
  try {
    await deleteHeroSlide(req.params.id);
    res.status(200).json({ success: true, message: "Slide hero supprimé." });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getHeroSlides,
  getHeroSlidesAdmin,
  postCreateHeroSlide,
  putUpdateHeroSlide,
  deleteHeroSlideHandler,
};
