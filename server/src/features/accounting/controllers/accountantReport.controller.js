const {
  buildAccountantReport,
  saveDownloadedReport,
  emailAccountantReportToAdmins,
  listAccountantReports,
  getStoredReportPdfBuffer,
} = require("../services/accountantReport.service");

function getRequestedByLabel(user) {
  return user?.name || user?.email || "Utilisateur";
}

async function getReportPreview(req, res, next) {
  try {
    const report = await buildAccountantReport(
      req.query,
      getRequestedByLabel(req.user),
    );
    res.status(200).json({ success: true, data: report });
  } catch (err) {
    next(err);
  }
}

async function downloadReportPdf(req, res, next) {
  try {
    const { pdfBuffer, filename } = await saveDownloadedReport(
      req.query,
      req.user,
    );
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${filename}"`,
    );
    res.status(200).send(pdfBuffer);
  } catch (err) {
    next(err);
  }
}

async function sendReportEmail(req, res, next) {
  try {
    const result = await emailAccountantReportToAdmins(
      req.body,
      getRequestedByLabel(req.user),
      { generatedById: req.user?.id ?? null },
    );
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function getReportHistory(req, res, next) {
  try {
    const result = await listAccountantReports(req.query);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function downloadStoredReportPdf(req, res, next) {
  try {
    const { pdfBuffer, filename } = await getStoredReportPdfBuffer(req.params.id);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${filename}"`,
    );
    res.status(200).send(pdfBuffer);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getReportPreview,
  downloadReportPdf,
  sendReportEmail,
  getReportHistory,
  downloadStoredReportPdf,
};
