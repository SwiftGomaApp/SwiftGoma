const {
  createIncident,
  updateIncident,
  listIncidents,
  getOverallStatus,
} = require("../services/incident.service");

async function getIncidents(req, res, next) {
  try {
    const [incidents, overall] = await Promise.all([
      listIncidents(),
      getOverallStatus(),
    ]);
    res.status(200).json({
      success: true,
      data: { incidents, overallStatus: overall.status, severity: overall.severity ?? null },
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

module.exports = { getIncidents, postCreateIncident, patchUpdateIncident };
