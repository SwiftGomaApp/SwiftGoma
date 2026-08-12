const {
  createExpense,
  listExpenses,
  getExpenseById,
  rejectExpense,
  EXPENSE_CATEGORIES,
} = require("../services/expense.service");
const {
  requestExpenseApproval,
  resendExpenseApproval,
  confirmExpenseApproval,
} = require("../services/expenseApproval.service");

function parseExpenseBody(body = {}) {
  return {
    title: body.title,
    description: body.description,
    category: body.category,
    amount: body.amount,
    currency: body.currency,
    incurredAt: body.incurredAt,
    vendorName: body.vendorName,
    vendorPhone: body.vendorPhone,
    countryCode: body.countryCode,
    providerName: body.providerName,
    customerMessage: body.customerMessage,
  };
}

async function createExpenseHandler(req, res, next) {
  try {
    const expense = await createExpense(
      req.user.id,
      parseExpenseBody(req.body),
      req.file,
    );
    res.status(201).json({ success: true, data: expense });
  } catch (err) {
    next(err);
  }
}

async function listExpensesHandler(req, res, next) {
  try {
    const result = await listExpenses(req.query);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function getExpenseHandler(req, res, next) {
  try {
    const expense = await getExpenseById(req.params.id);
    res.status(200).json({ success: true, data: expense });
  } catch (err) {
    next(err);
  }
}

async function rejectExpenseHandler(req, res, next) {
  try {
    const expense = await rejectExpense(
      req.user.id,
      req.params.id,
      req.body.reason,
    );
    res.status(200).json({ success: true, data: expense });
  } catch (err) {
    next(err);
  }
}

async function requestExpenseApprovalHandler(req, res, next) {
  try {
    const result = await requestExpenseApproval(req.user.id, req.params.id);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function confirmExpenseApprovalHandler(req, res, next) {
  try {
    const result = await confirmExpenseApproval(req.user.id, req.params.id, req.body);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function resendExpenseApprovalHandler(req, res, next) {
  try {
    const result = await resendExpenseApproval(req.user.id, req.params.id, req.body);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function getExpenseMetaHandler(_req, res) {
  res.status(200).json({
    success: true,
    data: { categories: EXPENSE_CATEGORIES },
  });
}

module.exports = {
  createExpenseHandler,
  listExpensesHandler,
  getExpenseHandler,
  rejectExpenseHandler,
  requestExpenseApprovalHandler,
  resendExpenseApprovalHandler,
  confirmExpenseApprovalHandler,
  getExpenseMetaHandler,
};
