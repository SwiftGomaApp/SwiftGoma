import { WifiOff, Clock, AlertTriangle } from "lucide-react";

type ApiStatusBannerProps = {
  status: "offline" | "rate-limited" | "error";
};

const CONFIG = {
  offline: {
    icon: WifiOff,
    message:
      "Impossible de contacter le serveur. Certaines fonctionnalités peuvent être indisponibles.",
  },
  "rate-limited": {
    icon: Clock,
    message:
      "Trop de requêtes envoyées. Veuillez patienter quelques instants avant de réessayer.",
  },
  error: {
    icon: AlertTriangle,
    message:
      "Une erreur est survenue. Certaines données peuvent être manquantes.",
  },
} as const;

export function ApiStatusBanner({ status }: ApiStatusBannerProps) {
  const { icon: Icon, message } = CONFIG[status];

  return (
    <div className="flex items-center justify-center gap-2 bg-destructive/10 px-4 py-2 text-center text-sm text-destructive">
      <Icon className="h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}
