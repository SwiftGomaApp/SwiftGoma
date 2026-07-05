"use strict";

const handlers = new Map();

function registerDepositHandler(type, handler) {
  if (handlers.has(type)) {
    throw new Error(`Un handler est déjà enregistré pour le type "${type}".`);
  }
  handlers.set(type, handler);
}

async function dispatchDepositCallback(callback) {
  const type = callback?.metadata?.type;

  if (!type) {
    console.warn(
      "[pawapay] callback de dépôt sans metadata.type — impossible de router:",
      callback?.depositId,
    );
    return;
  }

  const handler = handlers.get(type);
  if (!handler) {
    console.warn(
      `[pawapay] aucun handler enregistré pour le type "${type}"`,
      callback?.depositId,
    );
    return;
  }

  await handler(callback);
}

module.exports = { registerDepositHandler, dispatchDepositCallback };
