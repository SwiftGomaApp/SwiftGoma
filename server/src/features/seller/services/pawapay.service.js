const axios = require("axios");
const { v4: uuidv4 } = require("uuid");

const BASE_URL =
  process.env.PAWAPAY_SANDBOX === "true"
    ? "https://api.sandbox.pawapay.io"
    : "https://api.pawapay.io";

const CORRESPONDENT = {
  ORANGE: "ORANGE_COD",
  AIRTEL: "AIRTEL_COD",
  MPESA: "VODACOM_MPESA_COD",
};

const getClient = () =>
  axios.create({
    baseURL: BASE_URL,
    headers: {
      Authorization: `Bearer ${process.env.PAWAPAY_API_TOKEN}`,
      "Content-Type": "application/json",
    },
    timeout: 15000,
  });

const initiateDeposit = async ({
  amount,
  currency,
  provider,
  phoneNumber,
  description,
}) => {
  const depositId = uuidv4();
  const correspondent = CORRESPONDENT[provider];

  if (!correspondent) {
    throw new Error(
      `Opérateur invalide : ${provider}. Valeurs : ORANGE, AIRTEL, MPESA.`,
    );
  }

  const payload = {
    depositId,
    amount: Number(amount).toFixed(2),
    currency,
    correspondent,
    payer: {
      type: "MSISDN",
      address: {
        value: phoneNumber.replace(/\s+/g, ""),
      },
    },
    customerTimestamp: new Date().toISOString(),
    description: description.substring(0, 22),
    statementDescription: "SWIFTGOMA",
  };

  console.log(
    `PawaPay deposit initiated: ${depositId} — ${amount} ${currency} via ${provider}`,
  );

  const { data } = await getClient().post("/v1/deposits", payload);

  return {
    depositId,
    status: data.status,
    rejectionReason: data.rejectionReason ?? null,
    raw: data,
  };
};

const getDepositStatus = async (depositId) => {
  const { data } = await getClient().get(`/v1/deposits/${depositId}`);
  return data;
};

const parseWebhook = (body) => {
  const {
    depositId,
    status,
    amount,
    currency,
    correspondent,
    msisdn,
    completedAt,
    failureReason,
  } = body;

  if (!depositId || !status) {
    throw new Error("Webhook PawaPay invalide : depositId ou status manquant.");
  }

  if (!["COMPLETED", "FAILED"].includes(status)) {
    throw new Error(`Statut webhook inconnu : ${status}`);
  }

  return {
    depositId,
    status,
    amount,
    currency,
    correspondent,
    msisdn,
    completedAt: completedAt ? new Date(completedAt) : null,
    failureReason: failureReason ?? null,
  };
};

module.exports = { initiateDeposit, getDepositStatus, parseWebhook };
