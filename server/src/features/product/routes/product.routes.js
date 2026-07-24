const express = require("express");
const {
  getCategories,
  getCategory,
  postCreateCategory,
  putUpdateCategory,
  postCreateSubcategory,
  putUpdateSubcategory,
} = require("../controllers/category.controller");
const {
  postCreateProduct,
  getMyShopProducts,
  putUpdateProduct,
  postSetProductStatus,
  postAdjustStock,
  getVariantStockHistory,
  getProducts,
  getProductBySlugHandler,
} = require("../controllers/product.controller");
const { authenticate } = require("../../../common/middleware/authenticate");
const { authorize } = require("../../../common/middleware/authorize");
const { imageUpload } = require("../../../common/middleware/upload");

const ProductRouter = express.Router();

const productImages = imageUpload.array("images", 10);

// -----------------------------
// PUBLIC — pas d'auth
// -----------------------------
ProductRouter.get("/categories", getCategories);
ProductRouter.get("/categories/:id", getCategory);

ProductRouter.get("/", getProducts);
ProductRouter.get("/slug/:slug", getProductBySlugHandler);

// -----------------------------
// À partir d'ici, authentification requise
// -----------------------------
ProductRouter.use(authenticate);

// ----- Categories (ADMIN/SUPPORT) -----
ProductRouter.post(
  "/categories",
  authorize("ADMIN", "SUPPORT"),
  postCreateCategory,
);
ProductRouter.put(
  "/categories/:id",
  authorize("ADMIN", "SUPPORT"),
  putUpdateCategory,
);
ProductRouter.post(
  "/categories/:categoryId/subcategories",
  authorize("ADMIN", "SUPPORT"),
  postCreateSubcategory,
);
ProductRouter.put(
  "/categories/subcategories/:id",
  authorize("ADMIN", "SUPPORT"),
  putUpdateSubcategory,
);

// ----- Products (vendeur) -----
ProductRouter.post("/", productImages, postCreateProduct);
ProductRouter.get("/shop/:shopId", getMyShopProducts);
ProductRouter.put("/:id", putUpdateProduct);
ProductRouter.post("/:id/status", postSetProductStatus);

// ----- Stock (vendeur) -----
ProductRouter.post("/variants/:variantId/stock", postAdjustStock);
ProductRouter.get("/variants/:variantId/stock/history", getVariantStockHistory);

module.exports = ProductRouter;
