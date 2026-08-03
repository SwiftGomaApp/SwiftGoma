import { ShieldCheck, Truck } from "lucide-react";

export function ProductTrustInfo() {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border p-4">
      <div className="flex gap-3">
        <ShieldCheck className="h-5 w-5 shrink-0 text-primary" />
        <div className="flex flex-col">
          <span className="text-sm font-medium text-foreground">
            Paiement sécurisé
          </span>
          <span className="text-xs text-muted-foreground">
            Pour un paiement en ligne, vos fonds sont retenus jusqu&apos;à la
            confirmation de réception. Le paiement à la livraison est aussi
            disponible.
          </span>
        </div>
      </div>
      <div className="flex gap-3">
        <Truck className="h-5 w-5 shrink-0 text-primary" />
        <div className="flex flex-col">
          <span className="text-sm font-medium text-foreground">
            Confirmation à la livraison
          </span>
          <span className="text-xs text-muted-foreground">
            Un code QR est scanné à la remise du colis pour confirmer votre
            commande.
          </span>
        </div>
      </div>
    </div>
  );
}
