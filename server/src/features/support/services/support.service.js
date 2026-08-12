const { getPrismaClient } = require("../../../config/prisma");
const { ValidationError } = require("../../../common/errors");
const { isValidEmail } = require("../../auth/utils/auth");
const { sendContactSupportEmail } = require("../../../common/emails");
const { BRAND } = require("../../../common/constants/brand");

const prisma = getPrismaClient();

const SUBJECT_LABELS = {
  general: "Question générale",
  account: "Compte et connexion",
  order: "Commande",
  payment: "Paiement / Retrait",
  seller: "Compte Vendeur",
  delivery: "Livraison",
  privacy: "Confidentialité / Données personnelles",
  other: "Autre",
};

const MESSAGE_STATUSES = ["OPEN", "IN_PROGRESS", "CLOSED"];

const assigneeInclude = {
  assignedTo: { select: { id: true, name: true, role: true } },
};

function parsePagination(query = {}) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(query.limit) || 20));
  return { page, limit, skip: (page - 1) * limit };
}

function buildContactMessageWhere(query = {}) {
  const where = {};
  const subject = typeof query.subject === "string" ? query.subject.trim() : "";
  const search = typeof query.search === "string" ? query.search.trim() : "";
  const status = typeof query.status === "string" ? query.status.trim() : "";

  if (subject && SUBJECT_LABELS[subject]) {
    where.subject = subject;
  }

  if (status && MESSAGE_STATUSES.includes(status)) {
    where.status = status;
  }

  if (query.unread === "true") {
    where.isRead = false;
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { message: { contains: search, mode: "insensitive" } },
    ];
  }

  return where;
}

function formatContactMessage(message) {
  return {
    ...message,
    subjectLabel: SUBJECT_LABELS[message.subject] || message.subject,
  };
}

async function listContactMessages(query = {}) {
  const { page, limit, skip } = parsePagination(query);
  const where = buildContactMessageWhere(query);

  const [items, total] = await Promise.all([
    prisma.contactMessage.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: assigneeInclude,
    }),
    prisma.contactMessage.count({ where }),
  ]);

  return {
    items: items.map(formatContactMessage),
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

async function getContactMessageById(id) {
  const message = await prisma.contactMessage.findUnique({
    where: { id },
    include: assigneeInclude,
  });
  if (!message) {
    throw new ValidationError("Message introuvable.");
  }
  return formatContactMessage(message);
}

async function getContactMessageStats() {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [total, last7Days, unread, open] = await Promise.all([
    prisma.contactMessage.count(),
    prisma.contactMessage.count({
      where: { createdAt: { gte: sevenDaysAgo } },
    }),
    prisma.contactMessage.count({ where: { isRead: false } }),
    prisma.contactMessage.count({ where: { status: { not: "CLOSED" } } }),
  ]);
  return { total, last7Days, unread, open };
}

async function updateContactMessage(id, actor, payload = {}) {
  const existing = await prisma.contactMessage.findUnique({ where: { id } });
  if (!existing) throw new ValidationError("Message introuvable.");

  const data = {};

  if (payload.status !== undefined) {
    if (!MESSAGE_STATUSES.includes(payload.status)) {
      throw new ValidationError("Statut invalide.");
    }
    data.status = payload.status;
    data.closedAt = payload.status === "CLOSED" ? new Date() : null;
  }

  if (payload.isRead !== undefined) {
    data.isRead = Boolean(payload.isRead);
    data.readAt = payload.isRead ? new Date() : null;
  }

  if (payload.assignedToId !== undefined) {
    if (payload.assignedToId === null || payload.assignedToId === "") {
      data.assignedToId = null;
      data.assignedAt = null;
    } else {
      const assignee = await prisma.user.findUnique({
        where: { id: payload.assignedToId },
      });
      if (!assignee || !["ADMIN", "SUPPORT"].includes(assignee.role)) {
        throw new ValidationError("Assignation invalide.");
      }
      data.assignedToId = assignee.id;
      data.assignedAt = new Date();
      if (existing.status === "OPEN") {
        data.status = "IN_PROGRESS";
        data.closedAt = null;
      }
    }
  }

  if (payload.internalNote !== undefined) {
    data.internalNote =
      typeof payload.internalNote === "string"
        ? payload.internalNote.trim() || null
        : null;
  }

  const updated = await prisma.contactMessage.update({
    where: { id },
    data,
    include: assigneeInclude,
  });

  return formatContactMessage(updated);
}

async function assignContactMessageToMe(id, actor) {
  return updateContactMessage(id, actor, { assignedToId: actor.id });
}

async function submitContactMessage({ name, email, subject, message }) {
  if (!name || typeof name !== "string" || !name.trim()) {
    throw new ValidationError("Veuillez indiquer votre nom.");
  }
  if (!isValidEmail(email)) {
    throw new ValidationError("Adresse e-mail invalide.");
  }
  if (!subject || !SUBJECT_LABELS[subject]) {
    throw new ValidationError("Veuillez choisir un sujet valide.");
  }
  if (!message || typeof message !== "string" || !message.trim()) {
    throw new ValidationError("Veuillez saisir votre message.");
  }

  const contactMessage = await prisma.contactMessage.create({
    data: {
      name: name.trim(),
      email: email.trim(),
      subject,
      message: message.trim(),
    },
  });

  try {
    await sendContactSupportEmail(BRAND.supportEmail, {
      name: contactMessage.name,
      email: contactMessage.email,
      subjectLabel: SUBJECT_LABELS[subject],
      message: contactMessage.message,
    });
  } catch (err) {
    console.error(
      "[support] Failed to send contact notification email:",
      err.message,
    );
  }

  return { id: contactMessage.id, received: true };
}

module.exports = {
  submitContactMessage,
  listContactMessages,
  getContactMessageById,
  getContactMessageStats,
  updateContactMessage,
  assignContactMessageToMe,
  SUBJECT_LABELS,
};
