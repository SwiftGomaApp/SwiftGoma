"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  ShieldCheck,
  Store,
  Tags,
  Users,
  Bell,
  Newspaper,
  UserX,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getSupportOverview,
  type SupportOverview,
} from "@/lib/api/routes/dashboard";
import { getErrorMessage } from "@/lib/get-error-message";
import { SupportMetricsChart } from "@/components/global/support-metrics-chart";
import { ui } from "@/lib/i18n/common";

function StatCard({
  title,
  value,
  subtitle,
  isLoading,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  isLoading: boolean;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-muted-foreground text-sm font-medium">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-20" />
        ) : (
          <>
            <p className="text-2xl font-bold">{value}</p>
            {subtitle && (
              <p className="text-muted-foreground mt-1 text-xs">{subtitle}</p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function ActionCard({
  title,
  description,
  count,
  href,
  badge,
  isLoading,
}: {
  title: string;
  description: string;
  count: number;
  href: string;
  badge?: string;
  isLoading: boolean;
}) {
  return (
    <Card className={count > 0 ? "border-primary/30" : undefined}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          {badge && (
            <Badge variant={count > 0 ? "default" : "secondary"}>{badge}</Badge>
          )}
        </div>
        <p className="text-muted-foreground text-xs">{description}</p>
      </CardHeader>
      <CardContent className="flex items-center justify-between">
        {isLoading ? (
          <Skeleton className="h-8 w-12" />
        ) : (
          <p className="text-3xl font-bold">{count}</p>
        )}
        <Button variant="outline" size="sm" nativeButton={false} render={<Link href={href} />}>
          {ui.review}
          <ArrowRight className="ml-1 h-3.5 w-3.5" />
        </Button>
      </CardContent>
    </Card>
  );
}

const QUICK_LINKS = [
  { title: "Messages", href: "/messages", icon: MessageSquare },
  { title: "Revue KYC", href: "/sellers/kyc", icon: ShieldCheck },
  { title: "Vendeurs", href: "/sellers", icon: Building2 },
  { title: "Boutiques", href: "/shops", icon: Store },
  { title: "Utilisateurs", href: "/users", icon: Users },
  { title: "Catégories", href: "/categories", icon: Tags },
  { title: "Blog", href: "/blog", icon: Newspaper },
  { title: "Notifications", href: "/notifications", icon: Bell },
] as const;

export default function SupportDashboardPage() {
  const [overview, setOverview] = useState<SupportOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadOverview() {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getSupportOverview();
      setOverview(data);
    } catch (err) {
      setError(getErrorMessage(err, "Impossible de charger le tableau de bord support."));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadOverview();
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold">Tableau de bord support</h1>
        <p className="text-muted-foreground text-sm">
          Votre file d'attente — KYC, vendeurs, boutiques et utilisateurs
          nécessitant une attention.
        </p>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="flex items-center justify-between pt-6">
            <p className="text-destructive text-sm">{error}</p>
            <Button type="button" variant="outline" size="sm" onClick={loadOverview}>
              {ui.retry}
            </Button>
          </CardContent>
        </Card>
      )}

      <div>
        <h2 className="mb-3 text-sm font-semibold">File d'actions</h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <ActionCard
            title="Messages de contact"
            description="Demandes reçues via le formulaire d'aide du site"
            count={overview?.contactMessages.last7Days ?? 0}
            href="/messages"
            badge="7 jours"
            isLoading={isLoading}
          />
          <ActionCard
            title="KYC à examiner"
            description="Nouvelles soumissions en attente de revue support"
            count={overview?.kyc.awaitingSupportReview ?? 0}
            href="/sellers/kyc"
            badge="Support"
            isLoading={isLoading}
          />
          <ActionCard
            title="En attente d'approbation admin"
            description="KYC revus par le support en attente de validation admin"
            count={overview?.kyc.awaitingAdminApproval ?? 0}
            href="/sellers/kyc"
            badge="Admin"
            isLoading={isLoading}
          />
          <ActionCard
            title="Boutiques suspendues"
            description="Boutiques hors ligne pouvant nécessiter un suivi"
            count={overview?.shops.byStatus.SUSPENDED ?? 0}
            href="/shops"
            isLoading={isLoading}
          />
          <ActionCard
            title="Utilisateurs bloqués"
            description="Comptes bloqués empêchés de se connecter"
            count={overview?.users.blocked ?? 0}
            href="/users"
            isLoading={isLoading}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        <StatCard
          title="Total utilisateurs"
          value={overview?.users.total ?? 0}
          subtitle={`${overview?.users.byRole.BUYER ?? 0} acheteurs · ${overview?.users.byRole.SELLER ?? 0} vendeurs`}
          isLoading={isLoading}
        />
        <StatCard
          title="Vendeurs actifs"
          value={overview?.sellerProfiles.byStatus.ACTIVE ?? 0}
          subtitle={`${overview?.sellerProfiles.byStatus.SUSPENDED ?? 0} suspendus`}
          isLoading={isLoading}
        />
        <StatCard
          title="File KYC"
          value={overview?.kyc.pendingAction ?? 0}
          subtitle={`${overview?.kyc.byStatus.APPROVED ?? 0} approuvées au total`}
          isLoading={isLoading}
        />
        <StatCard
          title="Boutiques publiées"
          value={overview?.shops.byStatus.PUBLISHED ?? 0}
          subtitle={`${overview?.shops.byStatus.DRAFT ?? 0} brouillons`}
          isLoading={isLoading}
        />
        <StatCard
          title="Produits publiés"
          value={overview?.products.byStatus.PUBLISHED ?? 0}
          isLoading={isLoading}
        />
        <StatCard
          title="Catégories"
          value={overview?.catalog.categories ?? 0}
          isLoading={isLoading}
        />
        <StatCard
          title="Articles de blog"
          value={overview?.catalog.blogPosts ?? 0}
          isLoading={isLoading}
        />
        <StatCard
          title="Messages de contact"
          value={overview?.contactMessages.total ?? 0}
          subtitle={`${overview?.contactMessages.last7Days ?? 0} sur les 7 derniers jours`}
          isLoading={isLoading}
        />
        <StatCard
          title="Livreurs"
          value={overview?.users.byRole.RIDER ?? 0}
          isLoading={isLoading}
        />
      </div>

      <SupportMetricsChart />

      <div>
        <h2 className="mb-3 text-sm font-semibold">Liens rapides</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {QUICK_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="hover:bg-muted flex items-center gap-3 rounded-lg border px-4 py-3 transition-colors"
            >
              <link.icon className="text-muted-foreground h-4 w-4 shrink-0" />
              <span className="text-sm font-medium">{link.title}</span>
              <ArrowRight className="text-muted-foreground ml-auto h-3.5 w-3.5" />
            </Link>
          ))}
        </div>
      </div>

      {!isLoading && (overview?.users.blocked ?? 0) > 0 && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="flex items-start gap-3 pt-6">
            <UserX className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <div>
              <p className="text-sm font-medium">
                {overview?.users.blocked}{" "}
                {(overview?.users.blocked ?? 0) === 1
                  ? "utilisateur bloqué"
                  : "utilisateurs bloqués"}
              </p>
              <p className="text-muted-foreground mt-1 text-xs">
                Le support peut consulter les détails des utilisateurs mais ne
                peut pas agir sur les comptes ADMIN ou SUPPORT. Utilisez la page
                Utilisateurs pour enquêter.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
