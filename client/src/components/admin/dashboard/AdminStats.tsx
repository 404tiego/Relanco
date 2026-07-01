import { Profile } from "@shared/schema";
import { ShieldCheck, TrendingUp, Users } from "lucide-react";
import { AdminStatCard } from "./AdminStatCard";

type AdminMetrics = {
  today: number;
  week: number;
  month: number;
};

export function AdminStats({
  metrics,
  profiles,
}: {
  metrics?: AdminMetrics;
  profiles?: Profile[];
}) {
  const adminsCount = profiles?.filter((p) => p.role === "admin").length || 0;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <AdminStatCard
        title="Aujourd'hui"
        value={metrics?.today ?? 0}
        icon={<TrendingUp className="h-4 w-4 text-green-500" />}
        description="Nouveaux inscrits"
      />
      <AdminStatCard
        title="Cette Semaine"
        value={metrics?.week ?? 0}
        icon={<Users className="h-4 w-4 text-primary" />}
        description="Inscriptions 7j"
      />
      <AdminStatCard
        title="Ce Mois"
        value={metrics?.month ?? 0}
        icon={<Users className="h-4 w-4 text-muted-foreground" />}
        description="Inscriptions 30j"
      />
      <AdminStatCard
        title="Admins"
        value={adminsCount}
        icon={<ShieldCheck className="h-4 w-4 text-primary" />}
        description="Administrateurs système"
      />
    </div>
  );
}
