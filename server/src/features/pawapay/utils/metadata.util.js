"use strict";

function buildMetadata(fields = {}) {
  const entries = Object.entries(fields).filter(
    ([, v]) => v !== undefined && v !== null,
  );

  if (entries.length > 10) {
    throw new Error("pawaPay n'accepte que 10 champs de metadata maximum.");
  }

  return entries.map(([fieldName, value]) => {
    if (typeof value === "object" && "value" in value) {
      return {
        fieldName,
        fieldValue: String(value.value),
        ...(value.isPII && { isPII: true }),
      };
    }
    return { fieldName, fieldValue: String(value) };
  });
}

module.exports = { buildMetadata };
