const { catchAsync } = require("../../../shared/utils/catchAsync");
const statusService = require("../services/status.service");
const incidentService = require("../services/incident.service");

const getPublicStatus = catchAsync(async (req, res) => {
  const data = await statusService.getPublicStatus();
  res.status(200).json({ success: true, data });
});

const createIncident = catchAsync(async (req, res) => {
  const { title, severity, message, affectedComponentSlugs } = req.body;
  const incident = await incidentService.createIncident({
    title,
    severity,
    message,
    affectedComponentSlugs,
  });
  res.status(201).json({
    success: true,
    message: "Incident créé.",
    data: incident,
  });
});

const addIncidentUpdate = catchAsync(async (req, res) => {
  const { status, message } = req.body;
  const incident = await incidentService.addIncidentUpdate(req.params.id, {
    status,
    message,
  });
  res.status(200).json({
    success: true,
    message: "Mise à jour ajoutée.",
    data: incident,
  });
});

module.exports = { getPublicStatus, createIncident, addIncidentUpdate };
