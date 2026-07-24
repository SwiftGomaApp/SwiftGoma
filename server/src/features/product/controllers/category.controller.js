const {
  createCategory,
  listCategories,
  getCategoryById,
  updateCategory,
  createSubcategory,
  updateSubcategory,
} = require("../services/category.service");

async function getCategories(req, res, next) {
  try {
    const includeInactive = req.query.includeInactive === "true";
    const categories = await listCategories({ includeInactive });
    res.status(200).json({ success: true, data: categories });
  } catch (err) {
    next(err);
  }
}

async function getCategory(req, res, next) {
  try {
    const category = await getCategoryById(req.params.id);
    res.status(200).json({ success: true, data: category });
  } catch (err) {
    next(err);
  }
}

// ADMIN only
async function postCreateCategory(req, res, next) {
  try {
    const category = await createCategory({
      name: req.body.name,
      sortOrder: req.body.sortOrder,
    });
    res.status(201).json({ success: true, data: category });
  } catch (err) {
    next(err);
  }
}

async function putUpdateCategory(req, res, next) {
  try {
    const category = await updateCategory(req.params.id, {
      name: req.body.name,
      sortOrder: req.body.sortOrder,
      isActive: req.body.isActive,
    });
    res.status(200).json({ success: true, data: category });
  } catch (err) {
    next(err);
  }
}

async function postCreateSubcategory(req, res, next) {
  try {
    const subcategory = await createSubcategory({
      categoryId: req.params.categoryId,
      name: req.body.name,
      sortOrder: req.body.sortOrder,
    });
    res.status(201).json({ success: true, data: subcategory });
  } catch (err) {
    next(err);
  }
}

async function putUpdateSubcategory(req, res, next) {
  try {
    const subcategory = await updateSubcategory(req.params.id, {
      name: req.body.name,
      sortOrder: req.body.sortOrder,
      isActive: req.body.isActive,
    });
    res.status(200).json({ success: true, data: subcategory });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getCategories,
  getCategory,
  postCreateCategory,
  putUpdateCategory,
  postCreateSubcategory,
  putUpdateSubcategory,
};
