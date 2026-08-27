const {
  createIncident,
  updateIncident,
  listIncidents,
  getOverallStatus,
} = require("../services/incident.service");

const DEFAULT_INCIDENTS_LIMIT = 50;
const MAX_INCIDENTS_LIMIT = 200;

function parseIncidentsLimit(rawLimit) {
  const parsed = parseInt(rawLimit, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return DEFAULT_INCIDENTS_LIMIT;
  return Math.min(parsed, MAX_INCIDENTS_LIMIT);
}

async function getIncidents(req, res, next) {
  try {
    const limit = parseIncidentsLimit(req.query.limit);
    const [incidents, overall] = await Promise.all([
      listIncidents(limit),
      getOverallStatus(),
    ]);
    res.status(200).json({
      success: true,
      data: {
        incidents,
        overallStatus: overall.status,
        severity: overall.severity ?? null,
      },
    });
  } catch (err) {
    next(err);
  }
}

async function postCreateIncident(req, res, next) {
  try {
    const incident = await createIncident({
      createdBy: req.user.id,
      title: req.body.title,
      description: req.body.description,
      severity: req.body.severity,
    });
    res.status(201).json({ success: true, data: incident });
  } catch (err) {
    next(err);
  }
}

async function patchUpdateIncident(req, res, next) {
  try {
    const incident = await updateIncident(req.params.id, {
      status: req.body.status,
      description: req.body.description,
      severity: req.body.severity,
    });
    res.status(200).json({ success: true, data: incident });
  } catch (err) {
    next(err);
  }
}

async function patchUpdateIncidentStatus(req, res, next) {
  try {
    const incident = await updateIncident(req.params.id, {
      status: req.body.status,
    });
    res.status(200).json({ success: true, data: incident });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getIncidents,
  postCreateIncident,
  patchUpdateIncident,
  patchUpdateIncidentStatus,
};
