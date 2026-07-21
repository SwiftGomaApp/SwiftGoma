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

async function generateInvoiceDocument(subscriptionPaymentId) {
  const existing = await prisma.invoice.findUnique({
    where: {
      subscriptionPaymentId_type: { subscriptionPaymentId, type: "INVOICE" },
    },
  });
  if (existing) return { record: existing, pdfBuffer: null };

  const payment = await getFullPaymentOrThrow(subscriptionPaymentId);
  const { sellerProfile } = payment.subscription;

  const documentNumber = await generateDocumentNumber("INVOICE");

  const pdfBuffer = await generateInvoicePdf({
    documentNumber,
    issuedAt: payment.createdAt,
    seller: buildSellerData(sellerProfile),
    planName: payment.plan.name,
    periodLabel: formatPeriodLabel(payment.periodStart, payment.periodEnd),
    quantity: 1,
    unitPrice: payment.amount,
    amount: payment.amount,
    currency: payment.currency,
  });

  const { url, publicId } = await uploadInvoiceAsset(pdfBuffer, documentNumber);

  const record = await prisma.invoice.create({
    data: {
      documentNumber,
      type: "INVOICE",
      subscriptionPaymentId,
      sellerProfileId: sellerProfile.id,
      pdfUrl: url,
      pdfPublicId: publicId,
    },
  });

  return { record, pdfBuffer };
}

async function generateReceiptDocument(subscriptionPaymentId) {
  const existing = await prisma.invoice.findUnique({
    where: {
      subscriptionPaymentId_type: {
        subscriptionPaymentId,
        type: "RECEIPT",
      },
    },
  });
  if (existing) return { record: existing, pdfBuffer: null };

  const payment = await getFullPaymentOrThrow(subscriptionPaymentId);
  if (payment.status !== "SUCCEEDED") {
    throw new Error(
      "Impossible de générer un reçu pour un paiement qui n'est pas confirmé.",
    );
  }

  const invoiceDoc = await prisma.invoice.findUnique({
    where: {
      subscriptionPaymentId_type: {
        subscriptionPaymentId,
        type: "INVOICE",
      },
    },
  });
  if (!invoiceDoc) {
    throw new Error(
      "La facture doit être générée avant le reçu pour ce paiement.",
    );
  }

  const { sellerProfile } = payment.subscription;
  const documentNumber = await generateDocumentNumber("RECEIPT");

  const pdfBuffer = await generateReceiptPdf({
    documentNumber,
    invoiceNumber: invoiceDoc.documentNumber,
    paidAt: payment.paidAt,
    seller: buildSellerData(sellerProfile),
    planName: payment.plan.name,
    periodLabel: formatPeriodLabel(payment.periodStart, payment.periodEnd),
    quantity: 1,
    unitPrice: payment.amount,
    amount: payment.amount,
    currency: payment.currency,
    paymentMethod: formatPaymentMethodLabel(payment.mobileMoneyProvider),
  });

  const { url, publicId } = await uploadInvoiceAsset(pdfBuffer, documentNumber);

  const record = await prisma.invoice.create({
    data: {
      documentNumber,
      type: "RECEIPT",
      subscriptionPaymentId,
      sellerProfileId: sellerProfile.id,
      pdfUrl: url,
      pdfPublicId: publicId,
    },
  });

  return { record, pdfBuffer };
}

async function generateInvoiceAndReceipt(subscriptionPaymentId) {
  const invoice = await generateInvoiceDocument(subscriptionPaymentId);
  const receipt = await generateReceiptDocument(subscriptionPaymentId);
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

module.exports = {
  generateInvoiceDocument,
  generateReceiptDocument,
  generateInvoiceAndReceipt,
  listInvoicesForSeller,
  getInvoiceById,
  getInvoiceStats,
  getInvoiceForDownload,
};
