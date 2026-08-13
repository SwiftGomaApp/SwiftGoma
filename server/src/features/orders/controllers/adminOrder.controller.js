const {
  listAdminOrders,
  getAdminOrderById,
  adminCancelOrder,
  adminRefundOrder,
} = require("../services/adminOrder.service");
const {
  requestAdminOrderRefundApproval,
  confirmAdminOrderRefundApproval,
} = require("../services/adminOrderRefundApproval.service");

async function getAdminOrders(req, res, next) {
  try {
    const result = await listAdminOrders(req.query);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function getAdminOrder(req, res, next) {
  try {
    const order = await getAdminOrderById(req.params.id);
    res.status(200).json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
}

async function postAdminCancelOrder(req, res, next) {
  try {
    const order = await adminCancelOrder(
      req.params.id,
      req.user,
      req.body.reason,
    );
    res.status(200).json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
}

async function postRequestOrderRefundApproval(req, res, next) {
  try {
    const result = await requestAdminOrderRefundApproval(
      req.user.id,
      req.params.id,
    );
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function postConfirmOrderRefund(req, res, next) {
  try {
    await confirmAdminOrderRefundApproval(req.user.id, req.params.id, {
      pendingId: req.body.pendingId,
      code: req.body.code,
    });
    const order = await getAdminOrderById(req.params.id);
    res.status(200).json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
}

async function postAdminRefundOrder(req, res, next) {
  try {
    const order = await adminRefundOrder(req.params.id);
    res.status(200).json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAdminOrders,
  getAdminOrder,
  postAdminCancelOrder,
  postRequestOrderRefundApproval,
  postConfirmOrderRefund,
  postAdminRefundOrder,
};
