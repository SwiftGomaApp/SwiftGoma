"use client";

import Link from "next/link";
import { Plus, Star, ShoppingBag, MapPin, BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Shop } from "@/lib/api/seller-api";

const statusLabel: Record<Shop["status"], string> = {
  DRAFT: "Brouillon",
  ACTIVE: "Active",
  SUSPENDED: "Suspendue",
  CLOSED: "Fermée",
};

const statusVariant: Record<
  Shop["status"],
  "default" | "secondary" | "destructive" | "outline"
> = {
  DRAFT: "outline",
  ACTIVE: "default",
  SUSPENDED: "destructive",
  CLOSED: "secondary",
};

export function ShopsList({ shops }: { shops: Shop[] }) {
  if (shops.length === 0) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-16 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-primary/10">
          <ShoppingBag className="size-7 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">
            Aucune boutique pour le moment
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Créez votre première boutique pour commencer à vendre vos produits
            sur SwiftGoma.
          </p>
        </div>
        <Button asChild>
          <Link href="/shop/new">
            <Plus className="size-4" />
            Créer ma boutique
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Mes boutiques</h1>
          <p className="text-sm text-muted-foreground">
            Gérez vos {shops.length} boutique{shops.length > 1 ? "s" : ""} sur
            SwiftGoma
          </p>
        </div>
        <Button asChild>
          <Link href="/shop/new">
            <Plus className="size-4" />
            Nouvelle boutique
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {shops.map((shop) => (
          <Link key={shop.id} href={`/shop/${shop.id}`}>
            <Card className="h-full transition-colors hover:border-primary/50">
              <CardContent className="flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <Avatar className="size-12 rounded-lg">
                    <AvatarImage src={shop.logo ?? undefined} alt={shop.name} />
                    <AvatarFallback className="rounded-lg">
                      {shop.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <Badge variant={statusVariant[shop.status]}>
                    {statusLabel[shop.status]}
                  </Badge>
                </div>

                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-medium leading-tight">{shop.name}</h3>
                    {shop.isVerified && (
                      <BadgeCheck className="size-4 shrink-0 text-primary" />
                    )}
                  </div>
                  <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="size-3" />
                    {shop.quartier}, {shop.commune}
                  </p>
                </div>

                <div className="flex items-center gap-4 border-t pt-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <ShoppingBag className="size-3.5" />
                    {shop.totalOrders} commandes
                  </span>
                  <span className="flex items-center gap-1">
                    <Star className="size-3.5 fill-amber-400 text-amber-400" />
                    {shop.averageRating.toFixed(1)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
