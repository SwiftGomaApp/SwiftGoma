const { catchAsync } = require("../../../shared/utils/catchAsync");
const { errors } = require("../../../shared/errors/app.error");
const invoiceService = require("../service/invoice.service");

const listInvoices = catchAsync(async (req, res) => {
  const { page, limit, type, status } = req.query;
  const result = await invoiceService.listInvoices({
    userId: req.user.id,
    page: page ? parseInt(page) : 1,
    limit: limit ? Math.min(parseInt(limit), 50) : 20,
    type,
    status,
  });
  res.status(200).json({ success: true, data: result });
});

const getInvoice = catchAsync(async (req, res) => {
  const invoice = await invoiceService.getInvoice({
    userId: req.user.id,
    invoiceId: req.params.id,
  });
  res.status(200).json({ success: true, data: invoice });
});

const adminGetInvoice = catchAsync(async (req, res) => {
  const invoice = await invoiceService.adminGetInvoice({
    invoiceId: req.params.id,
  });
  res.status(200).json({ success: true, data: invoice });
});

const adminListInvoices = catchAsync(async (req, res) => {
  const { page, limit, type, status } = req.query;
  const { prisma } = require("../../../config/db.config");

  const skip = ((parseInt(page) || 1) - 1) * (parseInt(limit) || 20);
  const where = {
    ...(type && { type }),
    ...(status && { status }),
  };

  const [invoices, total] = await Promise.all([
    prisma.invoice.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: parseInt(limit) || 20,
      include: { user: { select: { id: true, name: true, email: true } } },
    }),
    prisma.invoice.count({ where }),
  ]);

  res.status(200).json({
    success: true,
    data: { invoices, pagination: { total, page: parseInt(page) || 1 } },
  });
});

module.exports = {
  listInvoices,
  getInvoice,
  adminGetInvoice,
  adminListInvoices,
};
