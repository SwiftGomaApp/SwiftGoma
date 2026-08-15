function escapeCsvValue(value) {
  if (value === null || value === undefined) return "";
  const str = String(value);
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

function toCsv(rows, columns) {
  const header = columns.map((col) => escapeCsvValue(col.label)).join(",");
  const lines = rows.map((row) =>
    columns
      .map((col) =>
        escapeCsvValue(
          typeof col.value === "function" ? col.value(row) : row[col.value],
        ),
      )
      .join(","),
  );
  return [header, ...lines].join("\n");
}

module.exports = { toCsv };
