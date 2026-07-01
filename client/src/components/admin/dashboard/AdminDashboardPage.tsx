import { Profile } from "@shared/schema";
import { useAdminMetrics, useUserGrowth } from "@/hooks/use-supabase";
import { useAllProfiles } from "@/hooks/use-admin-profiles";
import { AdminSkeleton } from "@/components/admin/AdminSkeleton";
import { AdminStats } from "./AdminStats";
import { AdminGrowthChart } from "./AdminGrowthChart";

export function AdminDashboardPage() {
  const { data: profiles } = useAllProfiles({ enabled: true });
  const { data: metrics, isLoading: isLoadingMetrics } = useAdminMetrics();
  const { data: growthData, isLoading: isLoadingGrowth } = useUserGrowth();

  const isLoading = isLoadingMetrics || isLoadingGrowth;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-display font-bold tracking-tight">Aperçu Admin</h1>
        <p className="text-muted-foreground text-lg">Aperçu global et statistiques du système.</p>
      </div>

      {isLoading ? (
        <AdminSkeleton />
      ) : (
        <>
          <AdminStats metrics={metrics} profiles={profiles as Profile[] | undefined} />
          <AdminGrowthChart data={growthData as { date: string; count: number }[] | undefined} />
        </>
      )}
    </div>
  );
}
