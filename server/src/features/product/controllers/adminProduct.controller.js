const {
  listAdminProducts,
  getAdminProductById,
  adminUpdateProductStatus,
} = require("../services/adminProduct.service");

async function getAdminProducts(req, res, next) {
  try {
    const result = await listAdminProducts(req.query);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function getAdminProduct(req, res, next) {
  try {
    const product = await getAdminProductById(req.params.id);
    res.status(200).json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
}

async function postAdminProductStatus(req, res, next) {
  try {
    const product = await adminUpdateProductStatus(req.params.id, req.user, {
      status: req.body.status,
      reason: req.body.reason,
    });
    res.status(200).json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAdminProducts,
  getAdminProduct,
  postAdminProductStatus,
};
