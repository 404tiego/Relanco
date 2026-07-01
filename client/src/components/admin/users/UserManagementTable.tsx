import { Profile } from "@shared/schema";
import { format } from "date-fns";
import { useLocation } from "wouter";
import { ChevronLeft, ChevronRight, Clock, Filter, Mail, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ConfirmRoleChangeDialog } from "./ConfirmRoleChangeDialog";
import { UserActionsDropdown } from "./UserActionsDropdown";

type UserManagementTableProps = {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  roleFilter: string;
  setRoleFilter: (value: string) => void;
  profiles: Profile[];
  onToggleRole: (id: string, currentRole: string) => void;
  onToggleSubscriber: (id: string, current: boolean) => void;
  onDelete: (id: string) => void;
  page: number;
  totalPages: number;
  isFetching: boolean;
  isPlaceholderData: boolean;
  onPageChange: (page: number) => void;
  onPreviousPage: () => void;
  onNextPage: () => void;
};

export function UserManagementTable({
  searchQuery,
  setSearchQuery,
  roleFilter,
  setRoleFilter,
  profiles,
  onToggleRole,
  onToggleSubscriber,
  onDelete,
  page,
  totalPages,
  isFetching,
  isPlaceholderData,
  onPageChange,
  onPreviousPage,
  onNextPage,
}: UserManagementTableProps) {
  const [, navigate] = useLocation();

  const pageNumbers =
    totalPages <= 3
      ? Array.from({ length: totalPages }, (_, i) => i + 1)
      : page === 1
        ? [1, 2, 3]
        : page === totalPages
          ? [totalPages - 2, totalPages - 1, totalPages]
          : [page - 1, page, page + 1];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
        <div className="relative w-full flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher nom ou email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 w-full"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full sm:w-[200px] h-10 rounded-md border-sidebar-border bg-sidebar px-3 text-sidebar-foreground data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Tous les rôles" />
          </SelectTrigger>
          <SelectContent align="end" className="min-w-[200px] rounded-lg border-sidebar-border bg-sidebar p-1 text-sidebar-foreground">
            <SelectItem
              value="all"
              className="h-9 cursor-pointer rounded-md pr-2 pl-8 text-sm font-medium data-[highlighted]:bg-sidebar-accent data-[highlighted]:text-sidebar-accent-foreground"
            >
              Tous les rôles
            </SelectItem>
            <SelectItem
              value="user"
              className="h-9 cursor-pointer rounded-md pr-2 pl-8 text-sm font-medium data-[highlighted]:bg-sidebar-accent data-[highlighted]:text-sidebar-accent-foreground"
            >
              Utilisateurs
            </SelectItem>
            <SelectItem
              value="admin"
              className="h-9 cursor-pointer rounded-md pr-2 pl-8 text-sm font-medium data-[highlighted]:bg-sidebar-accent data-[highlighted]:text-sidebar-accent-foreground"
            >
              Administrateurs
            </SelectItem>
            <SelectItem
              value="subscriber"
              className="h-9 cursor-pointer rounded-md pr-2 pl-8 text-sm font-medium data-[highlighted]:bg-sidebar-accent data-[highlighted]:text-sidebar-accent-foreground"
            >
              Abonnés
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border/70 hover:bg-transparent">
              <TableHead>Utilisateur</TableHead>
              <TableHead>Rôle</TableHead>
              <TableHead>Abonné</TableHead>
              <TableHead>Inscription</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {profiles.length > 0 ? (
              profiles.map((profile: Profile) => (
                <TableRow
                  key={profile.id}
                  className="border-b border-border/60 last:border-b-0 cursor-pointer hover:bg-muted/40"
                  onClick={() => navigate(`/admin/users/${profile.id}`)}
                >
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="font-medium hover:underline">{profile.full_name || "N/A"}</span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Mail className="h-3 w-3" /> {profile.email}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <ConfirmRoleChangeDialog
                      profile={profile}
                      onConfirm={() => onToggleRole(profile.id, profile.role)}
                    />
                  </TableCell>
                  <TableCell>
                    <Badge variant={profile.is_subscriber ? "default" : "secondary"}>
                      {profile.is_subscriber ? "Oui" : "Non"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{profile.createdAt ? format(new Date(profile.createdAt), "dd/MM/yyyy") : "N/A"}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <UserActionsDropdown
                      profile={profile}
                      onToggleSubscriber={() => onToggleSubscriber(profile.id, !!profile.is_subscriber)}
                      onDelete={() => onDelete(profile.id)}
                    />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  Aucun utilisateur trouvé.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="mt-4 flex w-full justify-end">
        <div className="inline-flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onPreviousPage}
            disabled={page <= 1 || isFetching}
            className="h-8 gap-1 px-2 text-muted-foreground hover:text-foreground disabled:opacity-40"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Précédent
          </Button>
          {pageNumbers.map((pageNumber) => (
            <Button
              key={pageNumber}
              variant="ghost"
              size="sm"
              onClick={() => onPageChange(pageNumber)}
              disabled={isFetching}
              className={`h-8 w-8 rounded-md px-0 ${
                pageNumber === page
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {pageNumber}
            </Button>
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={onNextPage}
            disabled={page >= totalPages || isFetching || isPlaceholderData}
            className="h-8 gap-1 px-2 text-muted-foreground hover:text-foreground disabled:opacity-40"
          >
            Suivant
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
