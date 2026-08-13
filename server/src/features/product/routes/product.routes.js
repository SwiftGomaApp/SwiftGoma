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
  postSubmitReview,
} = require("../controllers/product.controller");
const {
  postCreateExchangeRate,
  putUpdateExchangeRate,
  putUpsertExchangeRate,
  getExchangeRateOne,
  getExchangeRates,
  deleteExchangeRateOne,
  postPreviewConversion,
} = require("../controllers/exchangeRate.controller");
const { authenticate } = require("../../../common/middleware/authenticate");
const { authorize } = require("../../../common/middleware/authorize");
const {
  imageUpload,
  verifyImageContents,
} = require("../../../common/middleware/upload");

const ProductRouter = express.Router();

const productImages = [imageUpload.array("images", 10), verifyImageContents];

ProductRouter.get("/categories", getCategories);
ProductRouter.get("/categories/:id", getCategory);

ProductRouter.get("/", getProducts);
ProductRouter.get("/slug/:slug", getProductBySlugHandler);

ProductRouter.use(authenticate);

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

ProductRouter.get(
  "/exchange-rates",
  authorize("ADMIN", "SUPPORT"),
  getExchangeRates,
);
ProductRouter.get(
  "/exchange-rates/:id",
  authorize("ADMIN", "SUPPORT"),
  getExchangeRateOne,
);
ProductRouter.post(
  "/exchange-rates",
  authorize("ADMIN", "SUPPORT"),
  postCreateExchangeRate,
);
ProductRouter.put(
  "/exchange-rates/:id",
  authorize("ADMIN", "SUPPORT"),
  putUpdateExchangeRate,
);
ProductRouter.put(
  "/exchange-rates",
  authorize("ADMIN", "SUPPORT"),
  putUpsertExchangeRate,
);
ProductRouter.delete(
  "/exchange-rates/:id",
  authorize("ADMIN", "SUPPORT"),
  deleteExchangeRateOne,
);
ProductRouter.post(
  "/exchange-rates/preview",
  authorize("ADMIN", "SUPPORT"),
  postPreviewConversion,
);

ProductRouter.post(
  "/",
  authorize("SELLER"),
  productImages,
  postCreateProduct,
);
ProductRouter.get("/shop/:shopId", authorize("SELLER"), getMyShopProducts);
ProductRouter.put("/:id", authorize("SELLER"), putUpdateProduct);
ProductRouter.post("/:id/status", authorize("SELLER"), postSetProductStatus);

ProductRouter.post("/:productId/reviews", postSubmitReview);

ProductRouter.post(
  "/variants/:variantId/stock",
  authorize("SELLER"),
  postAdjustStock,
);
ProductRouter.get(
  "/variants/:variantId/stock/history",
  authorize("SELLER"),
  getVariantStockHistory,
);

module.exports = ProductRouter;
