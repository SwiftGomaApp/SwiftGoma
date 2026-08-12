const { getPrismaClient } = require("../../../config/prisma");
const { NotFoundError, ValidationError } = require("../../../common/errors");
const {
  uploadPdf,
  uploadImage,
} = require("../../../common/services/cloudinaryUpload");
const { CLOUDINARY_FOLDERS } = require("../../../common/constants/cloudinaryFolders");
const {
  isValidAmount,
  isValidMsisdn,
  isValidStatementDescription,
} = require("../../payments/utils/pawapay.utils");
const { createNotification } = require("../../notification/services/notification.service");
const { NOTIFICATION_TYPES } = require("../../notification/config/notificationTypes");

const prisma = getPrismaClient();

const EXPENSE_CATEGORIES = [
  "OPERATIONS",
  "MARKETING",
  "PAYROLL",
  "LEGAL",
  "TRAVEL",
  "UTILITIES",
  "EQUIPMENT",
  "OTHER",
];

function parsePagination(query = {}) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(query.limit) || 20));
  return { page, limit, skip: (page - 1) * limit };
}

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

async function generateExpenseReference() {
  const dayStart = startOfDay(new Date());
  const count = await prisma.expense.count({
    where: { createdAt: { gte: dayStart } },
  });
  const dateKey = dayStart.toISOString().slice(0, 10).replace(/-/g, "");
  return `EXP-${dateKey}-${String(count + 1).padStart(3, "0")}`;
}

function mapExpense(record) {
  return {
    id: record.id,
    reference: record.reference,
    title: record.title,
    description: record.description,
    category: record.category,
    status: record.status,
    amount: record.amount,
    currency: record.currency,
    incurredAt: record.incurredAt.toISOString(),
    vendorName: record.vendorName,
    vendorPhone: record.vendorPhone,
    countryCode: record.countryCode,
    providerName: record.providerName,
    customerMessage: record.customerMessage,
    receiptUrl: record.receiptUrl,
    adminPayoutId: record.adminPayoutId,
    createdBy: record.createdBy
      ? { id: record.createdBy.id, name: record.createdBy.name }
      : null,
    approvedBy: record.approvedBy
      ? { id: record.approvedBy.id, name: record.approvedBy.name }
      : null,
    approvedAt: record.approvedAt?.toISOString() ?? null,
    rejectedBy: record.rejectedBy
      ? { id: record.rejectedBy.id, name: record.rejectedBy.name }
      : null,
    rejectedAt: record.rejectedAt?.toISOString() ?? null,
    rejectionReason: record.rejectionReason,
    adminPayout: record.adminPayout
      ? {
          id: record.adminPayout.id,
          status: record.adminPayout.status,
          externalId: record.adminPayout.externalId,
        }
      : null,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

const expenseInclude = {
  createdBy: { select: { id: true, name: true } },
  approvedBy: { select: { id: true, name: true } },
  rejectedBy: { select: { id: true, name: true } },
  adminPayout: {
    select: { id: true, status: true, externalId: true, createdAt: true },
  },
};

function validateExpenseInput(input = {}) {
  if (!input.title?.trim()) {
    throw new ValidationError("Le titre est requis.");
  }
  if (!EXPENSE_CATEGORIES.includes(input.category)) {
    throw new ValidationError("Catégorie invalide.");
  }
  if (!isValidAmount(input.amount)) {
    throw new ValidationError("Montant invalide.");
  }
  if (!input.currency?.trim()) {
    throw new ValidationError("La devise est requise.");
  }
  if (!input.vendorName?.trim()) {
    throw new ValidationError("Le nom du bénéficiaire est requis.");
  }
  if (!isValidMsisdn(input.vendorPhone)) {
    throw new ValidationError("Numéro de téléphone du bénéficiaire invalide.");
  }
  if (!input.providerName?.trim()) {
    throw new ValidationError("Le fournisseur mobile money est requis.");
  }
  if (!isValidStatementDescription(input.customerMessage)) {
    throw new ValidationError(
      "Le message client doit contenir 4 à 22 caractères alphanumériques.",
    );
  }
  if (!input.incurredAt || Number.isNaN(new Date(input.incurredAt).getTime())) {
    throw new ValidationError("Date de dépense invalide.");
  }
}

function buildPayoutInputFromExpense(expense) {
  return {
    amount: Number(expense.amount),
    currency: expense.currency,
    country: expense.countryCode,
    provider: expense.providerName,
    recipientPhoneNumber: expense.vendorPhone,
    customerMessage: expense.customerMessage,
  };
}

async function uploadReceipt(file) {
  if (!file) return null;
  if (file.mimetype === "application/pdf") {
    const result = await uploadPdf(file.buffer, CLOUDINARY_FOLDERS.EXPENSE_RECEIPTS);
    return { url: result.url, publicId: result.publicId };
  }
  const result = await uploadImage(file.buffer, CLOUDINARY_FOLDERS.EXPENSE_RECEIPTS);
  return { url: result.url, publicId: result.publicId };
}

async function notifyAdminsOfNewExpense(expense, createdByName) {
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN", isBlocked: false, deletedAt: null },
    select: { id: true },
  });

  if (admins.length === 0) return;

  await Promise.all(
    admins.map((admin) =>
      createNotification({
        userId: admin.id,
        type: NOTIFICATION_TYPES.PAYMENT,
        title: "Nouvelle dépense à approuver",
        body: `${createdByName} a soumis la dépense ${expense.reference} « ${expense.title} » (${expense.amount} ${expense.currency}) — en attente de votre approbation.`,
        data: {
          action: "expensePendingApproval",
          expenseId: expense.id,
          reference: expense.reference,
          href: "/expenses",
        },
      }),
    ),
  );
}

async function createExpense(userId, input, receiptFile = null) {
  validateExpenseInput(input);
  const receipt = await uploadReceipt(receiptFile);
  const reference = await generateExpenseReference();

  const record = await prisma.expense.create({
    data: {
      reference,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      category: input.category,
      amount: input.amount,
      currency: input.currency.trim().toUpperCase(),
      incurredAt: new Date(input.incurredAt),
      vendorName: input.vendorName.trim(),
      vendorPhone: input.vendorPhone.trim(),
      countryCode: (input.countryCode || "COD").trim().toUpperCase(),
      providerName: input.providerName.trim(),
      customerMessage: input.customerMessage.trim(),
      receiptUrl: receipt?.url ?? null,
      receiptPublicId: receipt?.publicId ?? null,
      createdById: userId,
    },
    include: expenseInclude,
  });

  try {
    await notifyAdminsOfNewExpense(
      record,
      record.createdBy?.name ?? "Comptable",
    );
  } catch (err) {
    console.error("[expense] Failed to notify admins of new expense:", err.message);
  }

  return mapExpense(record);
}

async function listExpenses(query = {}) {
  const { page, limit, skip } = parsePagination(query);
  const where = {};

  if (query.status) {
    where.status = String(query.status).toUpperCase();
  }
  if (query.category) {
    where.category = String(query.category).toUpperCase();
  }

  const [items, total] = await Promise.all([
    prisma.expense.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: expenseInclude,
    }),
    prisma.expense.count({ where }),
  ]);

  return {
    items: items.map(mapExpense),
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

async function getExpenseById(id) {
  const record = await prisma.expense.findUnique({
    where: { id },
    include: expenseInclude,
  });
  if (!record) {
    throw new NotFoundError("Dépense introuvable.");
  }
  return mapExpense(record);
}

async function getExpenseRecordForApproval(id) {
  const record = await prisma.expense.findUnique({ where: { id } });
  if (!record) {
    throw new NotFoundError("Dépense introuvable.");
  }
  if (!["PENDING", "FAILED"].includes(record.status)) {
    throw new ValidationError(
      "Seules les dépenses en attente ou en échec peuvent être approuvées.",
    );
  }
  return record;
}

async function resetFailedExpenseForApproval(id) {
  const record = await prisma.expense.findUnique({ where: { id } });
  if (!record) {
    throw new NotFoundError("Dépense introuvable.");
  }
  if (record.status !== "FAILED") {
    return record;
  }

  return prisma.expense.update({
    where: { id },
    data: {
      status: "PENDING",
      adminPayoutId: null,
      approvedById: null,
      approvedAt: null,
      rejectionReason: null,
    },
  });
}

async function rejectExpense(adminId, id, reason) {
  const record = await prisma.expense.findUnique({ where: { id } });
  if (!record) {
    throw new NotFoundError("Dépense introuvable.");
  }
  if (record.status !== "PENDING") {
    throw new ValidationError("Seules les dépenses en attente peuvent être rejetées.");
  }
  if (!reason?.trim()) {
    throw new ValidationError("Le motif de rejet est requis.");
  }

  const updated = await prisma.expense.update({
    where: { id },
    data: {
      status: "REJECTED",
      rejectedById: adminId,
      rejectedAt: new Date(),
      rejectionReason: reason.trim(),
    },
    include: expenseInclude,
  });

  try {
    await createNotification({
      userId: updated.createdById,
      type: NOTIFICATION_TYPES.PAYMENT,
      title: "Dépense rejetée",
      body: `Votre dépense ${updated.reference} « ${updated.title} » a été rejetée : ${reason.trim()}`,
      data: {
        action: "expenseRejected",
        expenseId: updated.id,
        reference: updated.reference,
        href: "/expenses",
      },
    });
  } catch (err) {
    console.error("[expense] Failed to notify accountant of rejection:", err.message);
  }

  return mapExpense(updated);
}

async function markExpenseProcessing(adminId, expenseId, adminPayoutId) {
  const updated = await prisma.expense.update({
    where: { id: expenseId },
    data: {
      status: "PROCESSING",
      adminPayoutId,
      approvedById: adminId,
      approvedAt: new Date(),
    },
    include: expenseInclude,
  });
  return mapExpense(updated);
}

async function markExpenseFailed(expenseId, failureReason) {
  await prisma.expense.update({
    where: { id: expenseId },
    data: {
      status: "FAILED",
      rejectionReason: failureReason,
    },
  });
}

module.exports = {
  EXPENSE_CATEGORIES,
  createExpense,
  listExpenses,
  getExpenseById,
  getExpenseRecordForApproval,
  rejectExpense,
  resetFailedExpenseForApproval,
  markExpenseProcessing,
  markExpenseFailed,
  buildPayoutInputFromExpense,
  validateExpenseInput,
};
