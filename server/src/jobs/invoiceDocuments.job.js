const { QUEUE_NAMES } = require("../common/constants/queueNames");
const { createWorker } = require("../config/worker");
const {
  sendOrderPaymentDocuments,
} = require("../features/orders/services/order.service");
const {
  sendSubscriptionInvoiceDocument,
  sendSubscriptionReceiptDocument,
} = require("../features/subscriptions/services/subscription.service");

async function processInvoiceDocumentJob(job) {
  switch (job.name) {
    case "order-payment-documents":
      return sendOrderPaymentDocuments(
        job.data.orderPaymentId,
        job.data.orderId,
      );

    case "subscription-invoice":
      return sendSubscriptionInvoiceDocument(job.data.paymentId, job.data.kind);

    case "subscription-receipt":
      return sendSubscriptionReceiptDocument(job.data.paymentId);

    default:
      console.warn(
        `[invoiceDocuments worker] Unknown job name "${job.name}" — skipping.`,
      );
  }
}

function startInvoiceDocumentsWorker() {
  const worker = createWorker(QUEUE_NAMES.INVOICES, processInvoiceDocumentJob);

  worker.on("failed", (job, err) => {
    console.error(
      `[invoiceDocuments worker] "${job?.name}" failed for payload ${JSON.stringify(job?.data)}:`,
      err.message,
    );
  });

  console.log(
    "[invoiceDocuments worker] Listening on queue:",
    QUEUE_NAMES.INVOICES,
  );
  return worker;
}

module.exports = { startInvoiceDocumentsWorker };
