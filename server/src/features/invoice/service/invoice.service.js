const { prisma } = require("../../../config/db.config");
const { cloudinary } = require("../../../config/coudinary.config");
const { errors } = require("../../../shared/errors/app.error");
const { generateInvoicePdf } = require("../invoice.pdf");
const { sendInvoiceEmail } = require("../../../services/email.service");
const notificationService = require("../../notifications/services/notification.service");

const generateInvoiceNumber = async () => {
  const year = new Date().getFullYear();

  const counter = await prisma.$transaction(async (tx) => {
    const existing = await tx.invoiceCounter.findUnique({ where: { year } });

    if (existing) {
      return tx.invoiceCounter.update({
        where: { year },
        data: { sequence: { increment: 1 } },
      });
    }

    return tx.invoiceCounter.create({
      data: { year, sequence: 1 },
    });
  });

  const seq = String(counter.sequence).padStart(4, "0");
  return `INV-${year}-${seq}`;
};

const uploadPdf = (buffer, invoiceNumber) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "swiftgoma/invoices",
        public_id: invoiceNumber,
        resource_type: "raw",
        type: "upload",
        format: "pdf",
      },
      (err, result) => {
        if (err) return reject(err);
        resolve(result.secure_url);
      },
    );
    stream.end(buffer);
  });
};

const issueInvoice = async ({
  userId,
  type,
  amount,
  currency,
  items,
  referenceId = null,
  referenceType = null,
  paidAt = null,
}) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, phone: true },
  });

  if (!user) throw new Error(`User not found: ${userId}`);

  const invoiceNumber = await generateInvoiceNumber();
  const now = new Date();

  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber,
      userId,
      type,
      status: paidAt ? "PAID" : "ISSUED",
      amount,
      currency,
      items,
      referenceId,
      referenceType,
      issuedAt: now,
      paidAt: paidAt ?? null,
    },
  });

  let pdfUrl = null;
  let pdfBuffer = null;

  try {
    pdfBuffer = await generateInvoicePdf(invoice, user);
    pdfUrl = await uploadPdf(pdfBuffer, invoiceNumber);

    await prisma.invoice.update({
      where: { id: invoice.id },
      data: { pdfUrl },
    });
  } catch (err) {
    console.error(`📄 Invoice PDF error [${invoiceNumber}]:`, err.message);
  }

  if (user.email) {
    sendInvoiceEmail({
      to: user.email,
      name: user.name,
      invoice: { ...invoice, pdfUrl },
      pdfBuffer,
    }).catch((err) =>
      console.error(`📧 Invoice email error [${invoiceNumber}]:`, err.message),
    );
  }

  notificationService
    .send({
      userId,
      type: "PAYMENT",
      title: `Facture ${invoiceNumber} émise`,
      body: `Votre facture de ${amount} ${currency} est disponible.`,
      data: { invoiceId: invoice.id, invoiceNumber, pdfUrl },
    })
    .catch(() => {});

  return { ...invoice, pdfUrl };
};

const listInvoices = async ({ userId, page = 1, limit = 20, type, status }) => {
  const skip = (page - 1) * limit;
  const where = {
    userId,
    ...(type && { type }),
    ...(status && { status }),
  };

  const [invoices, total] = await Promise.all([
    prisma.invoice.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      select: {
        id: true,
        invoiceNumber: true,
        type: true,
        status: true,
        amount: true,
        currency: true,
        pdfUrl: true,
        issuedAt: true,
        paidAt: true,
        createdAt: true,
      },
    }),
    prisma.invoice.count({ where }),
  ]);

  return {
    invoices,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

const getInvoice = async ({ userId, invoiceId }) => {
  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });

  if (!invoice || invoice.userId !== userId) {
    throw errors.badRequest("Facture introuvable.");
  }

  return invoice;
};

const adminGetInvoice = async ({ invoiceId }) => {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  if (!invoice) throw errors.badRequest("Facture introuvable.");
  return invoice;
};

module.exports = {
  issueInvoice,
  listInvoices,
  getInvoice,
  adminGetInvoice,
};
