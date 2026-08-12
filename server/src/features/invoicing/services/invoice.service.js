const { getPrismaClient } = require("../../../config/prisma");
const {
  uploadPdf,
  deleteAsset,
} = require("../../../common/services/cloudinaryUpload");
const {
  CLOUDINARY_FOLDERS,
} = require("../../../common/constants/cloudinaryFolders");
const { NotFoundError } = require("../../../common/errors");
const {
  generateDocumentNumber,
  formatPeriodLabel,
  formatPaymentMethodLabel,
} = require("../utils/invoicing.utils");

const {
  generateInvoicePdf,
  generateReceiptPdf,
  generatePayoutReceiptPdf,
} = require("../utils/invoicePdf");

const prisma = getPrismaClient();

async function getFullPaymentOrThrow(subscriptionPaymentId) {
  const payment = await prisma.subscriptionPayment.findUnique({
    where: { id: subscriptionPaymentId },
    include: {
      plan: true,
      subscription: {
        include: { sellerProfile: true },
      },
    },
  });
  if (!payment) {
    throw new NotFoundError("Paiement de subscription introuvable.");
  }
  return payment;
}

async function resolveSubscriptionPaymentContext(subscriptionPaymentId) {
  const payment = await getFullPaymentOrThrow(subscriptionPaymentId);
  const { sellerProfile } = payment.subscription;

  return {
    paymentIdField: "subscriptionPaymentId",
    paymentId: subscriptionPaymentId,
    status: payment.status,
    createdAt: payment.createdAt,
    paidAt: payment.paidAt,
    amount: payment.amount,
    currency: payment.currency,
    sellerProfile,
    paymentMethodLabel: formatPaymentMethodLabel(payment.mobileMoneyProvider),
    items: [
      {
        description: `Abonnement ${payment.plan.name}`,
        subDescription: formatPeriodLabel(
          payment.periodStart,
          payment.periodEnd,
        ),
        quantity: 1,
        unitPrice: payment.amount,
        subtotal: payment.amount,
      },
    ],
  };
}

async function resolvePayoutContext(walletTransactionId) {
  const walletTransaction = await prisma.walletTransaction.findUnique({
    where: { id: walletTransactionId },
    include: {
      wallet: {
        include: { sellerProfile: { include: { walletSettings: true } } },
      },
    },
  });
  if (!walletTransaction) {
    throw new NotFoundError("Transaction de payout introuvable.");
  }
  if (walletTransaction.type !== "PAYOUT_DEBIT") {
    throw new Error(
      `resolvePayoutContext: transaction ${walletTransactionId} is not a PAYOUT_DEBIT.`,
    );
  }

  const { sellerProfile } = walletTransaction.wallet;

  return {
    paymentIdField: "walletTransactionId",
    paymentId: walletTransactionId,
    status: walletTransaction.status,
    createdAt: walletTransaction.createdAt,
    paidAt: walletTransaction.createdAt,
    amount: walletTransaction.amount,
    currency: walletTransaction.currency,
    sellerProfile,
    payoutPhoneNumber: sellerProfile.walletSettings?.payoutPhoneNumber || "",
    paymentMethodLabel: formatPaymentMethodLabel(
      sellerProfile.walletSettings?.payoutProvider,
    ),
  };
}

async function resolveOrderPaymentContext(orderPaymentId) {
  const payment = await prisma.orderPayment.findUnique({
    where: { id: orderPaymentId },
    include: {
      order: {
        include: {
          items: true,
          shop: { include: { sellerProfile: true } },
        },
      },
    },
  });
  if (!payment) throw new NotFoundError("Paiement de commande introuvable.");

  const { sellerProfile } = payment.order.shop;

  return {
    paymentIdField: "orderPaymentId",
    paymentId: orderPaymentId,
    status: payment.status,
    createdAt: payment.createdAt,
    paidAt: payment.heldAt,
    amount: payment.amount,
    currency: payment.currency,
    sellerProfile,
    paymentMethodLabel: formatPaymentMethodLabel(payment.network),
    items: payment.order.items.map((item) => ({
      description: item.productName,
      subDescription: item.variantName || null,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      subtotal: item.subtotal,
    })),
  };
}

async function resolvePaymentContext(type, id) {
  if (type === "subscription") return resolveSubscriptionPaymentContext(id);
  if (type === "order") return resolveOrderPaymentContext(id);
  throw new Error(`resolvePaymentContext: unknown type "${type}"`);
}

function buildSellerData(sellerProfile) {
  return {
    businessName: sellerProfile.businessName,
    address: `${sellerProfile.address}, ${sellerProfile.city}`,
    contactEmail: sellerProfile.contactEmail,
  };
}

async function uploadInvoiceAsset(buffer, documentNumber) {
  const result = await uploadPdf(buffer, CLOUDINARY_FOLDERS.INVOICES, {
    public_id: documentNumber,
  });
  return { url: result.url, publicId: result.publicId };
}

async function generateInvoiceDocument(type, paymentId) {
  const context = await resolvePaymentContext(type, paymentId);

  const existing = await prisma.invoice.findUnique({
    where: {
      [`${context.paymentIdField}_type`]: {
        [context.paymentIdField]: context.paymentId,
        type: "INVOICE",
      },
    },
  });
  if (existing) return { record: existing, pdfBuffer: null };

  const documentNumber = await generateDocumentNumber("INVOICE");

  const pdfBuffer = await generateInvoicePdf({
    documentNumber,
    issuedAt: context.createdAt,
    seller: buildSellerData(context.sellerProfile),
    items: context.items,
    amount: context.amount,
    currency: context.currency,
  });

  const { url, publicId } = await uploadInvoiceAsset(pdfBuffer, documentNumber);

  const record = await prisma.invoice.create({
    data: {
      documentNumber,
      type: "INVOICE",
      [context.paymentIdField]: context.paymentId,
      sellerProfileId: context.sellerProfile.id,
      pdfUrl: url,
      pdfPublicId: publicId,
    },
  });

  return { record, pdfBuffer };
}

async function generateReceiptDocument(type, paymentId) {
  const context = await resolvePaymentContext(type, paymentId);

  const existing = await prisma.invoice.findUnique({
    where: {
      [`${context.paymentIdField}_type`]: {
        [context.paymentIdField]: context.paymentId,
        type: "RECEIPT",
      },
    },
  });
  if (existing) return { record: existing, pdfBuffer: null };

  if (context.status !== "SUCCEEDED") {
    throw new Error(
      "Impossible de générer un reçu pour un paiement qui n'est pas confirmé.",
    );
  }

  const invoiceDoc = await prisma.invoice.findUnique({
    where: {
      [`${context.paymentIdField}_type`]: {
        [context.paymentIdField]: context.paymentId,
        type: "INVOICE",
      },
    },
  });
  if (!invoiceDoc) {
    throw new Error(
      "La facture doit être générée avant le reçu pour ce paiement.",
    );
  }

  const documentNumber = await generateDocumentNumber("RECEIPT");

  const pdfBuffer = await generateReceiptPdf({
    documentNumber,
    invoiceNumber: invoiceDoc.documentNumber,
    paidAt: context.paidAt,
    seller: buildSellerData(context.sellerProfile),
    items: context.items,
    amount: context.amount,
    currency: context.currency,
    paymentMethod: context.paymentMethodLabel,
  });

  const { url, publicId } = await uploadInvoiceAsset(pdfBuffer, documentNumber);

  const record = await prisma.invoice.create({
    data: {
      documentNumber,
      type: "RECEIPT",
      [context.paymentIdField]: context.paymentId,
      sellerProfileId: context.sellerProfile.id,
      pdfUrl: url,
      pdfPublicId: publicId,
    },
  });

  return { record, pdfBuffer };
}

async function generateInvoiceAndReceipt(subscriptionPaymentId) {
  const invoice = await generateInvoiceDocument(
    "subscription",
    subscriptionPaymentId,
  );
  const receipt = await generateReceiptDocument(
    "subscription",
    subscriptionPaymentId,
  );
  return { invoice, receipt };
}

async function generateOrderInvoiceAndReceipt(orderPaymentId) {
  const invoice = await generateInvoiceDocument("order", orderPaymentId);
  const receipt = await generateReceiptDocument("order", orderPaymentId);
  return { invoice, receipt };
}

async function listInvoicesForSeller(
  sellerProfileId,
  { page = 1, limit = 20 } = {},
) {
  const safePage = Math.max(parseInt(page, 10) || 1, 1);
  const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
  const skip = (safePage - 1) * safeLimit;

  const [total, invoices] = await prisma.$transaction([
    prisma.invoice.count({ where: { sellerProfileId } }),
    prisma.invoice.findMany({
      where: { sellerProfileId },
      skip,
      take: safeLimit,
      orderBy: { issuedAt: "desc" },
      include: {
        subscriptionPayment: {
          select: { amount: true, currency: true, status: true },
        },
        orderPayment: {
          select: { amount: true, currency: true, status: true },
        },
        walletTransaction: {
          select: { amount: true, currency: true, status: true },
        },
      },
    }),
  ]);

  return {
    invoices,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(total / safeLimit) || 1,
    },
  };
}

async function listInvoicesForAdmin(query = {}) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
  const skip = (page - 1) * limit;

  const where = {};
  if (query.type) where.type = query.type;

  const search = typeof query.search === "string" ? query.search.trim() : "";
  if (search) {
    where.OR = [
      { documentNumber: { contains: search, mode: "insensitive" } },
      { sellerProfile: { businessName: { contains: search, mode: "insensitive" } } },
    ];
  }

  const [total, invoices] = await Promise.all([
    prisma.invoice.count({ where }),
    prisma.invoice.findMany({
      where,
      skip,
      take: limit,
      orderBy: { issuedAt: "desc" },
      include: {
        sellerProfile: {
          select: { id: true, businessName: true },
        },
        subscriptionPayment: {
          select: { amount: true, currency: true, status: true },
        },
        orderPayment: {
          select: { amount: true, currency: true, status: true },
        },
        walletTransaction: {
          select: { amount: true, currency: true, status: true },
        },
      },
    }),
  ]);

  return {
    items: invoices,
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

async function getInvoiceById(invoiceId) {
  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
  if (!invoice) throw new NotFoundError("Document introuvable.");
  return invoice;
}

async function getInvoiceForDownload(invoiceId, sellerProfileId) {
  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
  if (!invoice) throw new NotFoundError("Document introuvable.");
  if (invoice.sellerProfileId !== sellerProfileId) {
    throw new NotFoundError("Document introuvable.");
  }
  return invoice;
}

async function getInvoiceForAdminDownload(invoiceId) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      sellerProfile: { select: { id: true, businessName: true } },
    },
  });
  if (!invoice) throw new NotFoundError("Document introuvable.");
  return invoice;
}

async function getInvoiceStats() {
  const [byType, byMonth, totalCount] = await Promise.all([
    prisma.invoice.groupBy({
      by: ["type"],
      _count: { _all: true },
    }),

    prisma.$queryRaw`
      SELECT
        to_char("issuedAt", 'YYYY-MM') as month,
        type,
        COUNT(*)::int as count
      FROM invoices
      WHERE "issuedAt" >= NOW() - INTERVAL '6 months'
      GROUP BY month, type
      ORDER BY month ASC;
    `,

    prisma.invoice.count(),
  ]);

  const byTypeMap = byType.reduce((acc, row) => {
    acc[row.type] = row._count._all;
    return acc;
  }, {});

  return {
    totalDocuments: totalCount,
    byType: {
      INVOICE: byTypeMap.INVOICE ?? 0,
      RECEIPT: byTypeMap.RECEIPT ?? 0,
    },
    byMonth,
  };
}

async function generatePayoutReceipt(walletTransactionId) {
  const context = await resolvePayoutContext(walletTransactionId);

  const existing = await prisma.invoice.findUnique({
    where: {
      walletTransactionId_type: {
        walletTransactionId,
        type: "PAYOUT_RECEIPT",
      },
    },
  });
  if (existing) return { record: existing, pdfBuffer: null };

  if (context.status !== "COMPLETED") {
    throw new Error(
      "Impossible de générer un reçu pour un payout qui n'est pas confirmé.",
    );
  }

  const documentNumber = await generateDocumentNumber("PAYOUT_RECEIPT");

  const pdfBuffer = await generatePayoutReceiptPdf({
    documentNumber,
    paidAt: context.paidAt,
    seller: buildSellerData(context.sellerProfile),
    amount: context.amount,
    currency: context.currency,
    paymentMethod: context.paymentMethodLabel,
    payoutPhoneNumber: context.payoutPhoneNumber,
  });

  const { url, publicId } = await uploadInvoiceAsset(pdfBuffer, documentNumber);

  const record = await prisma.invoice.create({
    data: {
      documentNumber,
      type: "PAYOUT_RECEIPT",
      walletTransactionId,
      sellerProfileId: context.sellerProfile.id,
      pdfUrl: url,
      pdfPublicId: publicId,
    },
  });

  return { record, pdfBuffer };
}

module.exports = {
  generateInvoiceDocument,
  generateReceiptDocument,
  generateInvoiceAndReceipt,
  listInvoicesForSeller,
  listInvoicesForAdmin,
  getInvoiceById,
  getInvoiceStats,
  getInvoiceForDownload,
  getInvoiceForAdminDownload,
  generateOrderInvoiceAndReceipt,
  generatePayoutReceipt,
};
