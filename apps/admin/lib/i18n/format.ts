const DATE = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const DATE_TIME = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

const DATE_SHORT = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
});

export function formatDate(dateStr: string): string {
  return DATE.format(new Date(dateStr));
}

export function formatDateTime(dateStr: string): string {
  return DATE_TIME.format(new Date(dateStr));
}

export function formatDateShort(dateStr: string): string {
  return DATE_SHORT.format(new Date(dateStr));
}

export function formatRelativeTime(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "À l'instant";
  if (minutes < 60) return `Il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `Il y a ${days} j`;
  return formatDateShort(dateStr);
}

export function formatChartDay(dateStr: string): string {
  return DATE_SHORT.format(new Date(dateStr));
}
