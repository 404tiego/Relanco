import { Profile } from "@shared/schema";
import { format, isToday, isYesterday } from "date-fns";
import { fr } from "date-fns/locale";
import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Clock3,
  CreditCard,
  Globe,
  Laptop,
  Loader2,
  Mail,
  Save,
  Trash2,
  ShieldX,
  ShieldCheck,
  UserCircle2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useProfile } from "@/hooks/use-supabase";
import {
  useAdminUserDetails,
  useRevokeAdminSession,
  useRevokeAllAdminSessions,
} from "@/hooks/use-admin-profiles";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ConfirmRoleChangeDialog } from "./ConfirmRoleChangeDialog";

type AdminUserDetailsPageProps = {
  userId: string;
};

type BillingDraft = {
  isSubscriber: boolean;
};

function formatDateTime(value: string | null) {
  if (!value) return "N/A";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "N/A";

  const time = format(parsed, "HH:mm", { locale: fr });

  if (isToday(parsed)) return `Aujourd'hui à ${time}`;
  if (isYesterday(parsed)) return `Hier à ${time}`;

  return format(parsed, "d MMMM yyyy 'à' HH:mm", { locale: fr });
}

function providerLabel(provider: string) {
  const normalized = provider.trim().toLowerCase();

  if (normalized === "google") return "Google";
  if (normalized === "email") return "Email";
  if (normalized === "github") return "GitHub";

  return normalized ? normalized.charAt(0).toUpperCase() + normalized.slice(1) : "Inconnu";
}

export function AdminUserDetailsPage({ userId }: AdminUserDetailsPageProps) {
  const { toast } = useToast();
  const { updateProfile, isUpdating } = useProfile();
  const { data, isLoading, isError, error, refetch } = useAdminUserDetails(userId);
  const revokeSessionMutation = useRevokeAdminSession(userId);
  const revokeAllMutation = useRevokeAllAdminSessions(userId);
  const [billingDraft, setBillingDraft] = useState<BillingDraft>({
    isSubscriber: false,
  });

  const initials = useMemo(() => {
    const displayName = data?.profile.fullName || data?.profile.email || "U";

    return displayName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  }, [data?.profile.fullName, data?.profile.email]);

  const currentBilling = useMemo<BillingDraft | null>(() => {
    if (!data) return null;

    return {
      isSubscriber: data.profile.isSubscriber,
    };
  }, [data]);

  useEffect(() => {
    if (currentBilling) {
      setBillingDraft(currentBilling);
    }
  }, [currentBilling]);

  const isBillingDirty =
    !!currentBilling && billingDraft.isSubscriber !== currentBilling.isSubscriber;

  const handlePlanChange = (plan: string) => {
    if (!plan) return;

    setBillingDraft((current) => ({
      ...current,
      isSubscriber: plan === "pro",
    }));
  };

  const handleSaveBilling = async () => {
    if (!data) return;

    try {
      await updateProfile({
        id: data.profile.id,
        updates: {
          is_subscriber: billingDraft.isSubscriber,
        },
      });
      await refetch();
      toast({
        title: "Abonnement mis a jour",
        description: "Le plan a ete sauvegarde.",
      });
    } catch (mutationError: any) {
      toast({
        variant: "destructive",
        title: "Echec de la mise a jour",
        description: mutationError?.message ?? "Impossible de mettre a jour l'abonnement.",
      });
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    try {
      await revokeSessionMutation.mutateAsync(sessionId);
      toast({ title: "Session supprimée", description: "La session a été révoquée." });
    } catch (mutationError: any) {
      toast({
        variant: "destructive",
        title: "Échec de suppression",
        description: mutationError?.message ?? "Impossible de supprimer cette session.",
      });
    }
  };

  const handleRevokeAll = async () => {
    try {
      await revokeAllMutation.mutateAsync();
      toast({ title: "Sessions révoquées", description: "Toutes les sessions ont été supprimées." });
    } catch (mutationError: any) {
      toast({
        variant: "destructive",
        title: "Échec de révocation",
        description: mutationError?.message ?? "Impossible de révoquer toutes les sessions.",
      });
    }
  };

  const handleToggleRole = async () => {
    if (!data) return;

    try {
      const newRole = data.profile.role === "admin" ? "user" : "admin";
      await updateProfile({ id: data.profile.id, updates: { role: newRole } });
      await refetch();
      toast({
        title: "Rôle mis à jour",
        description: `L'utilisateur est maintenant ${newRole === "admin" ? "Administrateur" : "Utilisateur"}.`,
      });
    } catch (mutationError: any) {
      toast({
        variant: "destructive",
        title: "Échec de la mise à jour",
        description: mutationError?.message ?? "Impossible de changer le rôle.",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-6 w-full max-w-xl" />
        </div>

        <Card className="border-border/60">
          <CardHeader className="pb-4">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="space-y-5 pt-0">
            <div className="flex items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-64" />
              </div>
            </div>
            <Separator />
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="space-y-2">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-6 w-32" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-2">
                <Skeleton className="h-6 w-36" />
                <Skeleton className="h-4 w-72" />
              </div>
              <Skeleton className="h-9 w-48 rounded-md" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            {[1, 2, 3].map((item) => (
              <div key={item} className="grid grid-cols-[1.4fr_1fr_0.8fr_1fr_3rem] items-center gap-4 rounded-lg border border-border/50 p-3">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-8 w-8 rounded-md justify-self-end" />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <Skeleton className="h-6 w-56" />
            <Skeleton className="h-4 w-80" />
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            {[1, 2].map((item) => (
              <div key={item} className="grid grid-cols-4 items-center gap-4 rounded-lg border border-border/50 p-3">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-6 w-24 rounded-full" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Impossible de charger l’utilisateur</AlertTitle>
          <AlertDescription>{(error as Error)?.message ?? "Une erreur inconnue est survenue."}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-display font-bold tracking-tight">Détail utilisateur</h1>
          <p className="text-muted-foreground text-lg">Consultez le profil, les sessions et les providers d’authentification.</p>
        </div>
      </div>

      <Card className="border-border/60">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl">Profil utilisateur</CardTitle>
          <CardDescription>Informations principales du compte.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 pt-0">
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12">
              {data.profile.avatarUrl ? <AvatarImage src={data.profile.avatarUrl} alt={data.profile.email || "Avatar"} /> : null}
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <p className="text-base font-semibold">{data.profile.fullName || "Nom non renseigné"}</p>
              <p className="text-sm text-muted-foreground">{data.profile.email || "Email non renseigné"}</p>
            </div>
          </div>

          <Separator />

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Rôle</p>
              <ConfirmRoleChangeDialog
                profile={{
                  id: data.profile.id,
                  email: data.profile.email,
                  full_name: data.profile.fullName,
                  avatar_url: null,
                  role: data.profile.role,
                  is_subscriber: data.profile.isSubscriber,
                  stripe_customer_id: null,
                  stripe_subscription_id: null,
                  subscription_status: null,
                  has_accepted_terms: false,
                  last_active_at: null,
                  createdAt: null,
                  updatedAt: null,
                } satisfies Profile}
                onConfirm={handleToggleRole}
              />
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Inscription</p>
              <p className="text-sm font-medium">{formatDateTime(data.profile.createdAt)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Dernière connexion</p>
              <p className="text-sm font-medium">{formatDateTime(data.profile.lastSignInAt)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Dernière activité</p>
              <p className="text-sm font-medium">{formatDateTime(data.profile.lastActiveAt)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl">
                <CreditCard className="h-5 w-5 text-muted-foreground" />
                Abonnement
              </CardTitle>
              <CardDescription>Gerez le plan de l'utilisateur.</CardDescription>
            </div>
            <Badge variant={billingDraft.isSubscriber ? "default" : "secondary"}>
              {billingDraft.isSubscriber ? "Plan Pro" : "Plan Gratuit"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2">
              <Label htmlFor="admin-user-plan">Plan</Label>
              <Select
                value={billingDraft.isSubscriber ? "pro" : "free"}
                onValueChange={handlePlanChange}
                disabled={isUpdating}
              >
                <SelectTrigger
                  id="admin-user-plan"
                  className="w-full sm:w-[200px] h-10 rounded-md border-sidebar-border bg-sidebar px-3 text-sidebar-foreground data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent
                  align="end"
                  className="min-w-[200px] rounded-lg border-sidebar-border bg-sidebar p-1 text-sidebar-foreground"
                >
                  <SelectItem
                    value="free"
                    className="h-9 cursor-pointer rounded-md pr-2 pl-8 text-sm font-medium data-[highlighted]:bg-sidebar-accent data-[highlighted]:text-sidebar-accent-foreground"
                  >
                    Gratuit
                  </SelectItem>
                  <SelectItem
                    value="pro"
                    className="h-9 cursor-pointer rounded-md pr-2 pl-8 text-sm font-medium data-[highlighted]:bg-sidebar-accent data-[highlighted]:text-sidebar-accent-foreground"
                  >
                    Pro
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button className="sm:min-w-36" onClick={handleSaveBilling} disabled={!isBillingDirty || isUpdating}>
              {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Sauvegarder
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-xl">Sessions actives</CardTitle>
              <CardDescription>Liste des sessions actives et expirées de l’utilisateur.</CardDescription>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={revokeAllMutation.isPending || data.sessions.length === 0}
                >
                  {revokeAllMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ShieldX className="h-4 w-4" />
                  )}
                  Révoquer toutes les sessions
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Révoquer toutes les sessions ?</AlertDialogTitle>
                  <AlertDialogDescription>
                    L'utilisateur sera déconnecté de tous ses appareils. Cette action ne peut pas être annulée.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleRevokeAll}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Révoquer
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          {data.sessionsUnavailable ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Sessions indisponibles</AlertTitle>
              <AlertDescription>
                Les sessions n’ont pas pu être chargées depuis votre projet Supabase. Vérifiez les permissions d’accès au schéma auth.
              </AlertDescription>
            </Alert>
          ) : null}

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Appareil</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Créée le</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.sessions.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={5} className="h-20 text-center text-muted-foreground">
                      Aucune session trouvée.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.sessions.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Laptop className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{session.device}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{session.ipAddress || "N/A"}</TableCell>
                      <TableCell>
                        <Badge variant={session.status === "active" ? "default" : "secondary"}>
                          {session.status === "active" ? "Actif" : "Expiré"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{formatDateTime(session.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              disabled={revokeSessionMutation.isPending}
                              aria-label="Supprimer la session"
                            >
                              {revokeSessionMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Supprimer cette session ?</AlertDialogTitle>
                              <AlertDialogDescription>
                                La session {session.device} sera révoquée immédiatement
                                {session.ipAddress ? ` depuis l'adresse IP ${session.ipAddress}` : ""}.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annuler</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleRevokeSession(session.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Supprimer
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl">Providers d’authentification</CardTitle>
          <CardDescription>Methods de connexion actuellement liées au compte.</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Provider</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Connecté le</TableHead>
                  <TableHead>Dernière connexion</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.providers.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={4} className="h-20 text-center text-muted-foreground">
                      Aucun provider trouvé.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.providers.map((provider) => (
                    <TableRow key={provider.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {provider.provider === "email" ? (
                            <Mail className="h-4 w-4 text-muted-foreground" />
                          ) : provider.provider === "google" ? (
                            <Globe className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <UserCircle2 className="h-4 w-4 text-muted-foreground" />
                          )}
                          <span className="font-medium">{providerLabel(provider.provider)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="gap-1">
                          <ShieldCheck className="h-3.5 w-3.5" />
                          Connecté
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{formatDateTime(provider.connectedAt)}</TableCell>
                      <TableCell className="text-sm">
                        <div className="inline-flex items-center gap-1 text-muted-foreground">
                          <Clock3 className="h-3.5 w-3.5" />
                          {formatDateTime(provider.lastSignInAt)}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
