const { prisma } = require("../../../config/db.config");
const { errors } = require("../../../shared/errors/app.error");
const notificationService = require("../../notifications/services/notification.service");
const { emitStatusUpdate } = require("../../../config/socket.config");

const SEVERITY_LABELS = {
  MINOR: "Mineur",
  MAJOR: "Majeur",
  CRITICAL: "Critique",
};

const STATUS_LABELS = {
  INVESTIGATING: "Enquête en cours",
  IDENTIFIED: "Cause identifiée",
  MONITORING: "Surveillance",
  RESOLVED: "Résolu",
};

const getUserIdsToNotify = async (severity) => {
  const where =
    severity === "MINOR"
      ? { role: "ADMIN", isDeleted: false, isActive: true }
      : { isDeleted: false, isActive: true };

  const users = await prisma.user.findMany({
    where,
    select: { id: true },
  });

  return users.map((u) => u.id);
};

const notifyUsers = async ({
  userIds,
  severity,
  title,
  body,
  emailSubject,
  emailBody,
  data,
}) => {
  if (userIds.length === 0) return;

  if (severity === "CRITICAL") {
    await Promise.allSettled(
      userIds.map((userId) =>
        notificationService.send({
          userId,
          type: "SYSTEM",
          title,
          body,
          data,
          emailSubject,
          emailBody,
        }),
      ),
    );
  } else {
    await notificationService.sendToMany({
      userIds,
      type: "SYSTEM",
      title,
      body,
      data,
    });
  }
};

const createIncident = async ({
  title,
  severity,
  message,
  affectedComponentSlugs = [],
}) => {
  if (!title) throw errors.badRequest("Le titre de l'incident est requis.");
  if (!severity)
    throw errors.badRequest("La gravité de l'incident est requise.");
  if (!message) throw errors.badRequest("Un message initial est requis.");

  const incident = await prisma.incident.create({
    data: {
      title,
      severity,
      affectedComponentSlugs,
      status: "INVESTIGATING",
      updates: {
        create: { status: "INVESTIGATING", message },
      },
    },
    include: { updates: { orderBy: { createdAt: "desc" } } },
  });

  const notifTitle = `[${SEVERITY_LABELS[severity]}] ${title}`;
  const notifBody = message;
  const emailSubject = `Incident SwiftGoma — ${SEVERITY_LABELS[severity]} : ${title}`;
  const emailBody = `${message}\n\nStatut actuel : Enquête en cours. Consultez notre page de statut pour les mises à jour.`;

  getUserIdsToNotify(severity)
    .then((userIds) =>
      notifyUsers({
        userIds,
        severity,
        title: notifTitle,
        body: notifBody,
        emailSubject,
        emailBody,
        data: {
          incidentId: incident.id,
          severity,
          status: "INVESTIGATING",
        },
      }),
    )
    .catch((err) =>
      console.error("⚠️  Incident notification error:", err.message),
    );

  emitStatusUpdate({
    type: "incident:new",
    incidentId: incident.id,
    severity,
    title,
  });

  return incident;
};

const addIncidentUpdate = async (incidentId, { status, message }) => {
  if (!status) throw errors.badRequest("Le statut est requis.");
  if (!message) throw errors.badRequest("Le message est requis.");

  const incident = await prisma.incident.findUnique({
    where: { id: incidentId },
  });
  if (!incident) throw errors.badRequest("Incident introuvable.");

  const isResolving = status === "RESOLVED";

  await prisma.$transaction([
    prisma.incidentUpdate.create({
      data: { incidentId, status, message },
    }),
    prisma.incident.update({
      where: { id: incidentId },
      data: {
        status,
        resolvedAt: isResolving ? new Date() : incident.resolvedAt,
      },
    }),
  ]);

  const updated = await prisma.incident.findUnique({
    where: { id: incidentId },
    include: { updates: { orderBy: { createdAt: "desc" } } },
  });

  const statusLabel = STATUS_LABELS[status] ?? status;
  const notifTitle = isResolving
    ? `✅ Résolu : ${incident.title}`
    : `Mise à jour : ${incident.title}`;
  const notifBody = `${statusLabel} — ${message}`;
  const emailSubject = isResolving
    ? `Incident résolu — ${incident.title}`
    : `Mise à jour incident — ${incident.title}`;
  const emailBody = `${statusLabel} : ${message}${
    isResolving
      ? "\n\nCet incident est maintenant résolu. Merci de votre patience."
      : "\n\nConsultez notre page de statut pour les dernières informations."
  }`;

  getUserIdsToNotify(incident.severity)
    .then((userIds) =>
      notifyUsers({
        userIds,
        severity: incident.severity,
        title: notifTitle,
        body: notifBody,
        emailSubject,
        emailBody,
        data: {
          incidentId,
          severity: incident.severity,
          status,
        },
      }),
    )
    .catch((err) =>
      console.error("⚠️  Incident update notification error:", err.message),
    );

  emitStatusUpdate({
    type: "incident:updated",
    incidentId,
    status,
    isResolved: isResolving,
  });

  return updated;
};

module.exports = { createIncident, addIncidentUpdate };
