const { getPrismaClient } = require("../../../config/prisma");
const { env } = require("../../../config/env");
const { ValidationError, NotFoundError } = require("../../../common/errors");
const { sendAdminAccountantReportEmail } = require("../../../common/emails");
const { generateAccountantReportPdf } = require("../utils/accountantReportPdf");
const { uploadPdf } = require("../../../common/services/cloudinaryUpload");
const {
  CLOUDINARY_FOLDERS,
} = require("../../../common/constants/cloudinaryFolders");

const prisma = getPrismaClient();
const MAX_PERIOD_DAYS = 366;
const DETAIL_LIMIT = 100;

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function parseReportPeriod(query = {}) {
  const now = new Date();
  const defaultFrom = startOfDay(
    new Date(now.getFullYear(), now.getMonth(), 1),
  );
  const defaultTo = endOfDay(now);

  const from = query.from ? startOfDay(new Date(query.from)) : defaultFrom;
  const to = query.to ? endOfDay(new Date(query.to)) : defaultTo;

  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    throw new ValidationError("Période invalide.");
  }
  if (from.getTime() > to.getTime()) {
    throw new ValidationError("La date de début doit précéder la date de fin.");
  }

  const daySpan = (to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000);
  if (daySpan > MAX_PERIOD_DAYS) {
    throw new ValidationError(
      `La période ne peut pas dépasser ${MAX_PERIOD_DAYS} jours.`,
    );
  }

  return { from, to };
}

function mapCurrencyTotals(rows, amountField = "amount") {
  return rows.map((row) => ({
    currency: row.currency,
    total: row._sum?.[amountField] ?? row._sum?.total ?? 0,
    count: row._count._all,
  }));
}

function expensesEnabled(client = prisma) {
  return Boolean(client.expense);
}

function adminPayoutReportWhere(from, to, client = prisma) {
  const where = { createdAt: { gte: from, lte: to } };
  if (expensesEnabled(client)) {
    where.expense = null;
  }
  return where;
}

async function fetchExpenseReportSlice(from, to, detailLimit = DETAIL_LIMIT) {
  if (!expensesEnabled()) {
    return {
      expenseRows: [],
      expenseTotals: [],
      expenseCount: 0,
      expensePendingCount: 0,
    };
  }

  const [expenseRows, expenseTotals, expenseCount, expensePendingCount] =
    await Promise.all([
      prisma.expense.findMany({
        where: { incurredAt: { gte: from, lte: to } },
        orderBy: { incurredAt: "desc" },
        take: detailLimit,
        include: {
          createdBy: { select: { name: true } },
          approvedBy: { select: { name: true } },
        },
      }),
      prisma.expense.groupBy({
        by: ["currency"],
        where: {
          incurredAt: { gte: from, lte: to },
          status: { in: ["COMPLETED"] },
        },
        _sum: { amount: true },
        _count: { _all: true },
      }),
      prisma.expense.count({
        where: { incurredAt: { gte: from, lte: to } },
      }),
      prisma.expense.count({
        where: {
          incurredAt: { gte: from, lte: to },
          status: "PENDING",
        },
      }),
    ]);

  return { expenseRows, expenseTotals, expenseCount, expensePendingCount };
}

function buildReportReference(from, to) {
  const fromKey = from.toISOString().slice(0, 10);
  const toKey = to.toISOString().slice(0, 10);
  return `RPT-${fromKey}_${toKey}`;
}

function buildPdfFilename(reference) {
  return `${reference.toLowerCase()}.pdf`;
}

function parsePagination(query = {}) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(query.limit) || 20));
  return { page, limit, skip: (page - 1) * limit };
}

function mapStoredReport(record) {
  return {
    id: record.id,
    reference: record.reference,
    period: {
      from: record.periodFrom.toISOString(),
      to: record.periodTo.toISOString(),
    },
    generatedByLabel: record.generatedByLabel,
    generatedBy: record.generatedBy
      ? { id: record.generatedBy.id, name: record.generatedBy.name }
      : null,
    source: record.source,
    recipients: record.recipients,
    summary: record.summary,
    truncated: record.truncated,
    createdAt: record.createdAt.toISOString(),
  };
}

async function persistAccountantReport({
  report,
  pdfBuffer,
  source,
  generatedById = null,
  generatedByLabel,
  recipients = [],
}) {
  const stamp = Date.now();
  const publicId = `${report.reference.toLowerCase()}-${stamp}`;
  const upload = await uploadPdf(
    pdfBuffer,
    CLOUDINARY_FOLDERS.ACCOUNTANT_REPORTS,
    {
      public_id: publicId,
    },
  );

  const record = await prisma.accountantReport.create({
    data: {
      reference: report.reference,
      periodFrom: new Date(report.period.from),
      periodTo: new Date(report.period.to),
      generatedById,
      generatedByLabel: generatedByLabel || report.requestedBy || "Système",
      source,
      pdfUrl: upload.url,
      pdfPublicId: upload.publicId,
      recipients,
      summary: report.summary,
      truncated: report.truncated,
    },
    include: {
      generatedBy: { select: { id: true, name: true } },
    },
  });

  return mapStoredReport(record);
}

async function buildAccountantReport(query = {}, requestedBy = null) {
  const { from, to } = parseReportPeriod(query);
  const reference = buildReportReference(from, to);

  const [
    subscriptionPaymentRows,
    subscriptionTotals,
    orderPaymentRows,
    orderPaymentTotals,
    completedOrderRows,
    orderGmvTotals,
    invoiceTypeCounts,
    adminPayoutRows,
    adminPayoutTotals,
    sellerPayoutRows,
    sellerPayoutTotals,
    subscriptionCount,
    orderPaymentCount,
    completedOrderCount,
    adminPayoutCount,
    sellerPayoutCount,
  ] = await Promise.all([
    prisma.subscriptionPayment.findMany({
      where: { status: "SUCCEEDED", paidAt: { gte: from, lte: to } },
      orderBy: { paidAt: "desc" },
      take: DETAIL_LIMIT,
      include: {
        plan: { select: { name: true } },
        subscription: {
          select: {
            sellerProfile: { select: { businessName: true } },
          },
        },
      },
    }),
    prisma.subscriptionPayment.groupBy({
      by: ["currency"],
      where: { status: "SUCCEEDED", paidAt: { gte: from, lte: to } },
      _sum: { amount: true },
      _count: { _all: true },
    }),
    prisma.orderPayment.findMany({
      where: { createdAt: { gte: from, lte: to } },
      orderBy: { createdAt: "desc" },
      take: DETAIL_LIMIT,
      select: {
        id: true,
        orderId: true,
        amount: true,
        currency: true,
        network: true,
        status: true,
        createdAt: true,
      },
    }),
    prisma.orderPayment.groupBy({
      by: ["currency"],
      where: {
        status: { in: ["SUCCEEDED", "RELEASED"] },
        createdAt: { gte: from, lte: to },
      },
      _sum: { amount: true },
      _count: { _all: true },
    }),
    prisma.order.findMany({
      where: {
        status: "COMPLETED",
        completedAt: { gte: from, lte: to },
      },
      orderBy: { completedAt: "desc" },
      take: DETAIL_LIMIT,
      select: {
        id: true,
        total: true,
        currency: true,
        completedAt: true,
        shop: { select: { name: true } },
      },
    }),
    prisma.order.groupBy({
      by: ["currency"],
      where: {
        status: "COMPLETED",
        completedAt: { gte: from, lte: to },
      },
      _sum: { total: true },
      _count: { _all: true },
    }),
    prisma.invoice.groupBy({
      by: ["type"],
      where: { issuedAt: { gte: from, lte: to } },
      _count: { _all: true },
    }),
    prisma.adminPayout.findMany({
      where: adminPayoutReportWhere(from, to),
      orderBy: { createdAt: "desc" },
      take: DETAIL_LIMIT,
      include: { admin: { select: { name: true } } },
    }),
    prisma.adminPayout.groupBy({
      by: ["currency"],
      where: adminPayoutReportWhere(from, to),
      _sum: { amount: true },
      _count: { _all: true },
    }),
    prisma.walletTransaction.findMany({
      where: {
        type: "PAYOUT_DEBIT",
        createdAt: { gte: from, lte: to },
      },
      orderBy: { createdAt: "desc" },
      take: DETAIL_LIMIT,
      include: {
        wallet: {
          include: {
            sellerProfile: {
              select: {
                businessName: true,
                walletSettings: { select: { payoutPhoneNumber: true } },
              },
            },
          },
        },
      },
    }),
    prisma.walletTransaction.groupBy({
      by: ["currency"],
      where: {
        type: "PAYOUT_DEBIT",
        createdAt: { gte: from, lte: to },
      },
      _sum: { amount: true },
      _count: { _all: true },
    }),
    prisma.subscriptionPayment.count({
      where: { status: "SUCCEEDED", paidAt: { gte: from, lte: to } },
    }),
    prisma.orderPayment.count({
      where: { createdAt: { gte: from, lte: to } },
    }),
    prisma.order.count({
      where: {
        status: "COMPLETED",
        completedAt: { gte: from, lte: to },
      },
    }),
    prisma.adminPayout.count({
      where: adminPayoutReportWhere(from, to),
    }),
    prisma.walletTransaction.count({
      where: {
        type: "PAYOUT_DEBIT",
        createdAt: { gte: from, lte: to },
      },
    }),
  ]);

  const { expenseRows, expenseTotals, expenseCount, expensePendingCount } =
    await fetchExpenseReportSlice(from, to);

  const invoiceMap = invoiceTypeCounts.reduce((acc, row) => {
    acc[row.type] = row._count._all;
    return acc;
  }, {});

  const truncated =
    subscriptionCount > DETAIL_LIMIT ||
    orderPaymentCount > DETAIL_LIMIT ||
    completedOrderCount > DETAIL_LIMIT ||
    adminPayoutCount > DETAIL_LIMIT ||
    sellerPayoutCount > DETAIL_LIMIT ||
    expenseCount > DETAIL_LIMIT;

  return {
    reference,
    generatedAt: new Date().toISOString(),
    requestedBy,
    period: {
      from: from.toISOString(),
      to: to.toISOString(),
    },
    truncated,
    summary: {
      subscriptionRevenue: mapCurrencyTotals(subscriptionTotals),
      orderPayments: mapCurrencyTotals(orderPaymentTotals),
      orderGmv: mapCurrencyTotals(orderGmvTotals, "total"),
      invoices: {
        total:
          (invoiceMap.INVOICE ?? 0) +
          (invoiceMap.RECEIPT ?? 0) +
          (invoiceMap.PAYOUT_RECEIPT ?? 0),
        INVOICE: invoiceMap.INVOICE ?? 0,
        RECEIPT: invoiceMap.RECEIPT ?? 0,
        PAYOUT_RECEIPT: invoiceMap.PAYOUT_RECEIPT ?? 0,
      },
      adminPayouts: {
        count: adminPayoutCount,
        totals: mapCurrencyTotals(adminPayoutTotals),
      },
      sellerPayouts: {
        count: sellerPayoutCount,
        totals: mapCurrencyTotals(sellerPayoutTotals, "amount"),
      },
      companyExpenses: {
        count: expenseCount,
        totals: mapCurrencyTotals(expenseTotals),
        pending: expensePendingCount,
      },
    },
    details: {
      subscriptionPayments: subscriptionPaymentRows.map((row) => ({
        paidAt: row.paidAt,
        businessName:
          row.subscription?.sellerProfile?.businessName ?? "Vendeur",
        planName: row.plan?.name ?? "Plan",
        amount: row.amount,
        currency: row.currency,
        status: row.status,
      })),
      orderPayments: orderPaymentRows.map((row) => ({
        orderId: row.orderId,
        amount: row.amount,
        currency: row.currency,
        network: row.network,
        status: row.status,
        createdAt: row.createdAt,
      })),
      completedOrders: completedOrderRows.map((row) => ({
        id: row.id,
        shopName: row.shop?.name ?? "Boutique",
        total: row.total,
        currency: row.currency,
        completedAt: row.completedAt,
      })),
      adminPayouts: adminPayoutRows.map((row) => ({
        createdAt: row.createdAt,
        provider: row.provider,
        beneficiary: row.beneficiary,
        phoneNumber: row.phoneNumber,
        amount: row.amount,
        currency: row.currency,
        status: row.status,
        externalId: row.externalId,
        adminName: row.admin?.name ?? "Admin",
      })),
      sellerPayouts: sellerPayoutRows.map((row) => ({
        createdAt: row.createdAt,
        businessName: row.wallet?.sellerProfile?.businessName ?? "Vendeur",
        amount: Math.abs(Number(row.amount)),
        currency: row.currency,
        status: row.status,
        payoutPhone:
          row.wallet?.sellerProfile?.walletSettings?.payoutPhoneNumber || null,
      })),
      companyExpenses: expenseRows.map((row) => ({
        incurredAt: row.incurredAt,
        reference: row.reference,
        title: row.title,
        category: row.category,
        vendorName: row.vendorName,
        amount: row.amount,
        currency: row.currency,
        status: row.status,
        createdByName: row.createdBy?.name ?? "Comptable",
        approvedByName: row.approvedBy?.name ?? null,
      })),
    },
  };
}

async function getAdminRecipientEmails() {
  const configured = (process.env.ADMIN_REPORT_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  if (configured.length > 0) {
    return [...new Set(configured)];
  }

  const admins = await prisma.user.findMany({
    where: { role: "ADMIN", deletedAt: null, isBlocked: false },
    select: {
      emails: {
        where: { isPrimary: true },
        select: { email: true },
        take: 1,
      },
    },
  });

  return [
    ...new Set(
      admins
        .map((admin) => admin.emails[0]?.email?.toLowerCase())
        .filter(Boolean),
    ),
  ];
}

async function generateAccountantReportPdfBuffer(
  query = {},
  requestedBy = null,
) {
  const report = await buildAccountantReport(query, requestedBy);
  const pdfBuffer = await generateAccountantReportPdf(report);
  return {
    report,
    pdfBuffer,
    filename: buildPdfFilename(report.reference),
  };
}

async function saveDownloadedReport(query = {}, user = null) {
  const requestedBy = user?.name || user?.email || "Utilisateur";
  const { report, pdfBuffer } = await generateAccountantReportPdfBuffer(
    query,
    requestedBy,
  );

  const stored = await persistAccountantReport({
    report,
    pdfBuffer,
    source: "DOWNLOAD",
    generatedById: user?.id ?? null,
    generatedByLabel: requestedBy,
  });

  return {
    report,
    pdfBuffer,
    filename: buildPdfFilename(report.reference),
    stored,
  };
}

async function emailAccountantReportToAdmins(
  query = {},
  requestedBy = null,
  options = {},
) {
  const recipients = await getAdminRecipientEmails();
  if (recipients.length === 0) {
    throw new ValidationError(
      "Aucun e-mail administrateur configuré pour recevoir le rapport.",
    );
  }

  const { report, pdfBuffer, filename } =
    await generateAccountantReportPdfBuffer(query, requestedBy);

  await sendAdminAccountantReportEmail(recipients, {
    report,
    requestedBy,
    filename,
    pdfBuffer,
    adminUrl: env.clientOrigins.find((origin) => /admin|3001/i.test(origin)),
  });

  const source = options.source || "EMAIL";
  const stored = await persistAccountantReport({
    report,
    pdfBuffer,
    source,
    generatedById: options.generatedById ?? null,
    generatedByLabel: requestedBy || "Utilisateur",
    recipients,
  });

  return {
    reference: report.reference,
    recipients,
    period: report.period,
    sentAt: new Date().toISOString(),
    stored,
  };
}

async function generateMonthlyAccountantReport() {
  const now = new Date();
  const from = startOfDay(new Date(now.getFullYear(), now.getMonth() - 1, 1));
  const to = endOfDay(new Date(now.getFullYear(), now.getMonth(), 0));
  return emailAccountantReportToAdmins(
    { from: from.toISOString(), to: to.toISOString() },
    "Rapport mensuel automatique",
    { source: "SCHEDULED" },
  );
}

async function listAccountantReports(query = {}) {
  const { page, limit, skip } = parsePagination(query);

  const [items, total] = await Promise.all([
    prisma.accountantReport.findMany({
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        generatedBy: { select: { id: true, name: true } },
      },
    }),
    prisma.accountantReport.count(),
  ]);

  return {
    items: items.map(mapStoredReport),
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

async function getStoredReportPdfBuffer(id) {
  const record = await prisma.accountantReport.findUnique({ where: { id } });
  if (!record) {
    throw new NotFoundError("Rapport comptable introuvable.");
  }

  const response = await fetch(record.pdfUrl);
  if (!response.ok) {
    throw new NotFoundError("Fichier PDF du rapport introuvable.");
  }

  const pdfBuffer = Buffer.from(await response.arrayBuffer());
  return {
    pdfBuffer,
    filename: buildPdfFilename(record.reference),
  };
}

function csvEscape(value) {
  if (value === null || value === undefined) return "";
  const str = String(value);
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

async function buildAccountantReportCsv(query = {}, requestedBy = null) {
  const report = await buildAccountantReport(query, requestedBy);
  const rows = [
    ["Rapport", report.reference],
    ["Période début", report.period.from],
    ["Période fin", report.period.to],
    [],
    ["Catégorie", "Devise", "Total", "Nombre"],
  ];

  const pushTotals = (label, totals) => {
    totals.forEach((t) => rows.push([label, t.currency, t.total, t.count]));
  };

  pushTotals("Revenus abonnements", report.summary.subscriptionRevenue);
  pushTotals("Paiements commandes", report.summary.orderPayments);
  pushTotals("GMV commandes", report.summary.orderGmv);
  pushTotals("Paiements admin sortants", report.summary.adminPayouts.totals);
  pushTotals("Retraits vendeurs", report.summary.sellerPayouts.totals);
  pushTotals("Dépenses SwiftGoma", report.summary.companyExpenses.totals);

  const csv = rows.map((row) => row.map(csvEscape).join(",")).join("\n");

  return { csv, filename: `${report.reference}.csv` };
}

module.exports = {
  parseReportPeriod,
  buildAccountantReport,
  generateAccountantReportPdfBuffer,
  saveDownloadedReport,
  emailAccountantReportToAdmins,
  generateMonthlyAccountantReport,
  listAccountantReports,
  getStoredReportPdfBuffer,
  buildAccountantReportCsv,
};
