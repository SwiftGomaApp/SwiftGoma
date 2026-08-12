const cron = require("node-cron");
const { withLock } = require("../common/services/distributedLock");
const {
  generateMonthlyAccountantReport,
} = require("../features/accounting/services/accountantReport.service");

function startAccountantReportJob() {
  cron.schedule("0 7 1 * *", async () => {
    console.log("[accounting] Envoi du rapport comptable mensuel...");
    try {
      const result = await withLock(
        "accountant-monthly-report",
        15 * 60 * 1000,
        generateMonthlyAccountantReport,
      );
      console.log(
        `[accounting] Rapport ${result.reference} envoyé à ${result.recipients.join(", ")}`,
      );
    } catch (err) {
      console.error(
        "[accounting] Échec de l'envoi du rapport mensuel:",
        err.message,
      );
    }
  });

  console.log(
    "[accounting] Rapport comptable mensuel planifié (1er de chaque mois à 07:00).",
  );
}

module.exports = { startAccountantReportJob };
