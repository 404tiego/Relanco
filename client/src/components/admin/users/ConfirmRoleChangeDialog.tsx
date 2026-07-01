import { Profile } from "@shared/schema";
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
import { Badge } from "@/components/ui/badge";

export function ConfirmRoleChangeDialog({
  profile,
  onConfirm,
}: {
  profile: Profile;
  onConfirm: () => void;
}) {
  const targetRole = profile.role === "admin" ? "Utilisateur" : "Administrateur";

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button className="transition-transform active:scale-95">
          <Badge
            variant={profile.role === "admin" ? "default" : "secondary"}
            className="cursor-pointer hover:opacity-80 transition-opacity"
          >
            {profile.role === "admin" ? "Administrateur" : "Utilisateur"}
          </Badge>
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmer le changement de rôle ?</AlertDialogTitle>
          <AlertDialogDescription>
            L'utilisateur {profile.email} passera au rôle {targetRole}.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Confirmer</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
