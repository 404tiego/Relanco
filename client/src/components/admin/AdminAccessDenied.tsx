import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AdminAccessDenied({ setLocation }: { setLocation: (path: string) => void }) {
  return (
    <div className="h-[80vh] flex flex-col items-center justify-center text-center space-y-4">
      <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center">
        <ShieldAlert className="w-8 h-8" />
      </div>
      <h1 className="text-2xl font-bold">Accès Refusé</h1>
      <p className="text-muted-foreground max-w-md">
        Vous n'avez pas les permissions nécessaires pour voir cette page. Cette zone est réservée aux administrateurs.
      </p>
      <Button onClick={() => setLocation("/app")}>Retour à l'application</Button>
    </div>
  );
}
