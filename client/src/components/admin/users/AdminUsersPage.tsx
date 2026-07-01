import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useProfile } from "@/hooks/use-supabase";
import { usePaginatedProfiles } from "@/hooks/use-admin-profiles";
import { Skeleton } from "@/components/ui/skeleton";
import { UserManagementTable } from "./UserManagementTable";

export function AdminUsersPage() {
  const { updateProfile, deleteProfile } = useProfile();
  const { toast } = useToast();

  const pageSize = 25;
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  const { data, isLoading, isFetching, isPlaceholderData } = usePaginatedProfiles({
    page,
    pageSize,
    searchQuery,
    roleFilter,
  });

  const profiles = data?.profiles || [];
  const totalPages = data?.totalPages || 1;

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setSearchQuery(searchInput.trim());
      setPage(1);
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [roleFilter]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  useEffect(() => {
    if (!isFetching && !isPlaceholderData && profiles.length === 0 && page > 1) {
      setPage((prev) => prev - 1);
    }
  }, [isFetching, isPlaceholderData, page, profiles.length]);

  const handleToggleSubscriber = async (id: string, current: boolean) => {
    try {
      await updateProfile({ id, updates: { is_subscriber: !current } });
      toast({ title: "Profil mis à jour", description: "Le statut d'abonné a été modifié." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Échec de la mise à jour", description: error.message });
    }
  };

  const handleToggleRole = async (id: string, currentRole: string) => {
    try {
      const newRole = currentRole === "admin" ? "user" : "admin";
      await updateProfile({ id, updates: { role: newRole as "user" | "admin" } });
      toast({
        title: "Rôle mis à jour",
        description: `L'utilisateur est maintenant ${newRole === "admin" ? "Administrateur" : "Utilisateur"}.`,
      });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Échec de la mise à jour", description: error.message });
    }
  };

  const handleDeleteUser = async (id: string) => {
    try {
      await deleteProfile(id);
      toast({ title: "Utilisateur supprimé", description: "L'utilisateur a été retiré avec succès." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Échec de la suppression", description: error.message });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-display font-bold tracking-tight">Gestion des Utilisateurs</h1>
        <p className="text-muted-foreground text-lg">Consultez et modifiez les comptes utilisateurs du système.</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : (
        <UserManagementTable
          searchQuery={searchInput}
          setSearchQuery={setSearchInput}
          roleFilter={roleFilter}
          setRoleFilter={setRoleFilter}
          profiles={profiles}
          onToggleRole={handleToggleRole}
          onToggleSubscriber={handleToggleSubscriber}
          onDelete={handleDeleteUser}
          page={page}
          totalPages={totalPages}
          isFetching={isFetching}
          isPlaceholderData={isPlaceholderData}
          onPageChange={setPage}
          onPreviousPage={() => setPage((prev) => Math.max(1, prev - 1))}
          onNextPage={() => setPage((prev) => Math.min(totalPages, prev + 1))}
        />
      )}
    </div>
  );
}
