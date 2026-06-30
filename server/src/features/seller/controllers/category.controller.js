const { catchAsync } = require("../../../shared/utils/catchAsync");
const categoryService = require("../services/category.service");

const listCategories = catchAsync(async (req, res) => {
  const { parentId } = req.query;
  const categories = await categoryService.listCategories({
    parentId: parentId ?? null,
  });
  res.status(200).json({ success: true, data: categories });
});

const getCategoryBySlug = catchAsync(async (req, res) => {
  const category = await categoryService.getCategoryBySlug(req.params.slug);
  res.status(200).json({ success: true, data: category });
});

const suggestCategory = catchAsync(async (req, res) => {
  const { name, description, parentId } = req.body;

  const category = await categoryService.suggestCategory({
    userId: req.user.id,
    name,
    description,
    parentId: parentId ?? null,
  });

  res.status(201).json({
    success: true,
    message:
      "Catégorie soumise. Elle sera visible après validation par l'équipe SwiftGoma.",
    data: category,
  });
});

const supportListCategories = catchAsync(async (req, res) => {
  const { status, page, limit } = req.query;
  const result = await categoryService.supportListCategories({
    status: status ?? undefined,
    page: page ? parseInt(page) : 1,
    limit: limit ? parseInt(limit) : 50,
  });
  res.status(200).json({ success: true, data: result });
});

const supportCreateCategory = catchAsync(async (req, res) => {
  const { name, description, parentId } = req.body;

  const category = await categoryService.supportCreateCategory({
    name,
    description,
    parentId: parentId ?? null,
    image: req.file?.path ?? null,
  });

  res.status(201).json({
    success: true,
    message: "Catégorie créée.",
    data: category,
  });
});

const approveCategory = catchAsync(async (req, res) => {
  const category = await categoryService.approveCategory({
    categoryId: req.params.id,
  });
  res.status(200).json({
    success: true,
    message: "Catégorie approuvée.",
    data: category,
  });
});

const rejectCategory = catchAsync(async (req, res) => {
  const { reason } = req.body;
  const category = await categoryService.rejectCategory({
    categoryId: req.params.id,
    reason,
  });
  res.status(200).json({
    success: true,
    message: "Catégorie refusée.",
    data: category,
  });
});

const supportUpdateCategory = catchAsync(async (req, res) => {
  const { name, description, parentId } = req.body;
  const category = await categoryService.supportUpdateCategory({
    categoryId: req.params.id,
    name,
    description,
    parentId: parentId ?? undefined,
    image: req.file?.path ?? undefined,
  });
  res.status(200).json({
    success: true,
    message: "Catégorie mise à jour.",
    data: category,
  });
});

const supportDeleteCategory = catchAsync(async (req, res) => {
  await categoryService.supportDeleteCategory({ categoryId: req.params.id });
  res.status(200).json({ success: true, message: "Catégorie supprimée." });
});

module.exports = {
  listCategories,
  getCategoryBySlug,
  suggestCategory,
  supportListCategories,
  supportCreateCategory,
  approveCategory,
  rejectCategory,
  supportUpdateCategory,
  supportDeleteCategory,
};
