const { getPrismaClient } = require("../../../config/prisma");
const { t } = require("../../../common/i18n/t");
const { ValidationError, NotFoundError } = require("../../../common/errors");
const {
  broadcastNotification,
} = require("../../notification/services/notification.service");
const {
  NOTIFICATION_TYPES,
} = require("../../notification/config/notificationTypes");

const prisma = getPrismaClient();

const SEVERITIES = ["MINOR", "MAJOR", "CRITICAL"];
const STATUSES = ["INVESTIGATING", "IDENTIFIED", "MONITORING", "RESOLVED"];
const TITLE_MAX_LENGTH = 200;
const DESCRIPTION_MAX_LENGTH = 5000;

async function createIncident({ createdBy, title, description, severity }) {
  if (!title || typeof title !== "string" || !title.trim()) {
    throw new ValidationError(t("incidents.titleRequired"));
  }
  if (title.trim().length > TITLE_MAX_LENGTH) {
    throw new ValidationError(t("incidents.titleTooLong"));
  }
  if (!description || typeof description !== "string" || !description.trim()) {
    throw new ValidationError(t("incidents.descriptionRequired"));
  }
  if (description.trim().length > DESCRIPTION_MAX_LENGTH) {
    throw new ValidationError(t("incidents.descriptionTooLong"));
  }
  const resolvedSeverity = severity || "MINOR";
  if (!SEVERITIES.includes(resolvedSeverity)) {
    throw new ValidationError(t("incidents.invalidSeverity"));
  }

  const incident = await prisma.incident.create({
    data: {
      title: title.trim(),
      description: description.trim(),
      severity: resolvedSeverity,
      status: "INVESTIGATING",
      createdBy: createdBy || null,
    },
  });

  await broadcastNotification({
    type: NOTIFICATION_TYPES.SYSTEM,
    title: `[${resolvedSeverity}] ${incident.title}`,
    body: incident.description,
    data: { incidentId: incident.id },
  });

  return incident;
}

async function updateIncident(id, { status, description, severity }) {
  const existing = await prisma.incident.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError(t("incidents.notFound"));

  if (status !== undefined && !STATUSES.includes(status)) {
    throw new ValidationError(t("incidents.invalidStatus"));
  }
  if (severity !== undefined && !SEVERITIES.includes(severity)) {
    throw new ValidationError(t("incidents.invalidSeverity"));
  }
  if (
    description !== undefined &&
    typeof description === "string" &&
    description.trim().length > DESCRIPTION_MAX_LENGTH
  ) {
    throw new ValidationError(t("incidents.descriptionTooLong"));
  }

  const statusChanged = status !== undefined && status !== existing.status;

  const resolvedAt =
    status === "RESOLVED"
      ? new Date()
      : status !== undefined && existing.status === "RESOLVED"
        ? null
        : undefined;

  const incident = await prisma.incident.update({
    where: { id },
    data: {
      ...(status !== undefined && { status }),
      ...(description !== undefined && {
        description:
          typeof description === "string" ? description.trim() : description,
      }),
      ...(severity !== undefined && { severity }),
      ...(resolvedAt !== undefined && { resolvedAt }),
    },
  });

  if (statusChanged) {
    await broadcastNotification({
      type: NOTIFICATION_TYPES.SYSTEM,
      title: `Mise à jour : ${incident.title}`,
      body: `Statut : ${incident.status}.${incident.description ? ` ${incident.description}` : ""}`,
      data: { incidentId: incident.id },
    });
  }

  return incident;
}

async function listIncidents(limit = 50) {
  return prisma.incident.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      title: true,
      description: true,
      severity: true,
      status: true,
      resolvedAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

async function getOverallStatus() {
  const active = await prisma.incident.findMany({
    where: { status: { not: "RESOLVED" } },
    orderBy: { severity: "desc" },
  });

  if (active.length === 0) return { status: "operational" };

  const severityOrder = { CRITICAL: 3, MAJOR: 2, MINOR: 1 };
  const worst = active.reduce((a, b) =>
    severityOrder[b.severity] > severityOrder[a.severity] ? b : a,
  );

  return { status: "degraded", severity: worst.severity };
}

module.exports = {
  createIncident,
  updateIncident,
  listIncidents,
  getOverallStatus,
};
