const {
  listPaymentLedger,
  exportPaymentLedger,
} = require("../services/paymentLedger.service");
const { toCsv } = require("../../../common/utils/csv");

// async function getPaymentLedger(req, res, next) {
//   try {
//     const result = await listPaymentLedger(req.query);
//     res.status(200).json({ success: true, data: result });
//   } catch (err) {
//     next(err);
//   }
// }

async function getPaymentLedger(req, res, next) {
  try {
    const result = await listPaymentLedger(req.query);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function exportPaymentLedgerCsvHandler(req, res, next) {
  try {
    const items = await exportPaymentLedger(req.query);
    const csv = toCsv(items, [
      { label: "Source", value: "source" },
      { label: "Direction", value: "direction" },
      { label: "Montant", value: "amount" },
      { label: "Devise", value: "currency" },
      { label: "Statut", value: "status" },
      { label: "Référence", value: "reference" },
      { label: "Libellé", value: "label" },
      { label: "Fournisseur", value: "provider" },
      { label: "Date", value: "createdAt" },
    ]);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="grand-livre-${Date.now()}.csv"`,
    );
    res.status(200).send(csv);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getPaymentLedger,
  exportPaymentLedgerCsvHandler,
};
