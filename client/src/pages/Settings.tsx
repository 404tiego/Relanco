import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertProfileSchema } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Loader2, User, Mail, Shield, AlertTriangle, Info, Car, Bot, CreditCard, MessageSquare, Send, CheckCircle2, Download } from "lucide-react";
import { useState } from "react";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

export default function Settings() {
  const { user, profile, signOut } = useAuth();
  const { updateProfile, deleteProfile, isDeleting } = useProfile();
  const { toast } = useToast();
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [agentTestOpen, setAgentTestOpen] = useState(false);
  const [agentTestMessage, setAgentTestMessage] = useState("");
  const [agentTestResponse, setAgentTestResponse] = useState("");
  const [isTestingAgent, setIsTestingAgent] = useState(false);

  const handleAgentTest = async () => {
    if (!agentTestMessage.trim()) return;
    setIsTestingAgent(true);
    setAgentTestResponse("");
    try {
      const res = await fetch("/api/agent/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: agentTestMessage }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAgentTestResponse(`Erreur : ${data.message || "Problème de connexion avec l'agent IA"}`);
      } else {
        setAgentTestResponse(data.response);
      }
    } catch (err: any) {
      setAgentTestResponse(`Erreur de connexion : ${err.message || "Impossible de contacter l'agent IA"}`);
    }
    setIsTestingAgent(false);
  };

  const form = useForm({
    resolver: zodResolver(insertProfileSchema.pick({ full_name: true })),
    defaultValues: {
      full_name: profile?.full_name || "",
    },
  });

  const onSubmit = async (data: { full_name: string | null }) => {
    if (!user) return;
    try {
      await updateProfile({ id: user.id, updates: { full_name: data.full_name || "" } });
      toast({ title: "Profil mis à jour", description: "Vos modifications ont été enregistrées." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erreur", description: error.message });
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    
    if (profile?.is_subscriber) {
      toast({
        variant: "destructive",
        title: "Action requise",
        description: "Veuillez d'abord résilier votre abonnement actif avant de supprimer votre compte.",
      });
      return;
    }

    if (deleteConfirmText !== "SUPPRIMER") {
      toast({
        variant: "destructive",
        title: "Validation incorrecte",
        description: "Veuillez saisir 'SUPPRIMER' exactement en majuscules pour confirmer.",
      });
      return;
    }

    try {
      await deleteProfile(user.id);
      toast({ title: "Compte supprimé", description: "Votre compte et vos données ont été définitivement supprimés." });
      await signOut();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erreur", description: error.message });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Paramètres</h1>
        <p className="text-muted-foreground">Gérez votre compte et vos préférences.</p>
      </div>

      <div className="grid gap-6">
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle>Informations Personnelles</CardTitle>
            <CardDescription>Mettez à jour vos informations de profil.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="full_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nom Complet</FormLabel>
                        <FormControl>
                          <Input placeholder="Jean Dupont" {...field} className="h-11" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="space-y-2">
                    <Label>Adresse Email</Label>
                    <Input value={user?.email || ""} disabled className="h-11 bg-muted" />
                    <p className="text-xs text-muted-foreground">L'email ne peut pas être modifié.</p>
                  </div>
                </div>
                <Button type="submit" disabled={form.formState.isSubmitting} className="shadow-sm">
                  {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Enregistrer les modifications
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {profile?.role === "admin" && (
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle>Statut du Compte</CardTitle>
              <CardDescription>Consultez vos permissions d'accès.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 p-4 border rounded-lg bg-primary/5 border-primary/10">
                <Shield className="h-8 w-8 text-primary" />
                <div>
                  <p className="font-medium">Rôle : Administrateur</p>
                  <p className="text-sm text-muted-foreground">
                    Vous avez un accès administratif complet à la plateforme.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              Agent IA — Test
            </CardTitle>
            <CardDescription>Testez la réponse de l'agent IA aux messages clients.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-4 p-4 border rounded-lg bg-secondary/20 border-border/30">
              <div className="flex-1 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Envoyez un message de test pour voir comment l'agent IA répond aux demandes clients.
                </p>
                <div className="flex flex-wrap gap-2">
                  <div style={{marginBottom: '12px'}}>
                    <a
                      href="https://saas-1.replit.app/api/download/extension"
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: '#D4A843',
                        color: '#08090A',
                        borderRadius: '20px',
                        padding: '10px 20px',
                        fontSize: '13px',
                        fontWeight: '700',
                        textDecoration: 'none'
                      }}
                    >
                      ⬇️ Télécharger l'extension Chrome
                    </a>
                  </div>
                  <Dialog open={agentTestOpen} onOpenChange={setAgentTestOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="rounded-full">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Tester l'agent IA
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Bot className="h-5 w-5 text-primary" />
                        Test de l'agent IA
                      </DialogTitle>
                      <DialogDescription>
                        Simulez une demande d'achat pour voir la réponse de l'agent.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Votre message (simulation client)</Label>
                        <Input
                          placeholder="Bonjour, je cherche une Peugeot 3008..."
                          value={agentTestMessage}
                          onChange={(e) => setAgentTestMessage(e.target.value)}
                        />
                      </div>
                      <Button
                        onClick={handleAgentTest}
                        disabled={isTestingAgent || !agentTestMessage.trim()}
                        className="w-full"
                      >
                        {isTestingAgent && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isTestingAgent ? "Analyse en cours..." : "Envoyer le test"}
                      </Button>
                      {agentTestResponse && (
                        <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                          <div className="flex items-center gap-2 mb-2">
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                            <span className="text-sm font-medium">Réponse de l'agent</span>
                          </div>
                          <p className="text-sm text-muted-foreground whitespace-pre-line">
                            {agentTestResponse}
                          </p>
                        </div>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5 text-primary" />
              Paramètres de la concession
            </CardTitle>
            <CardDescription>Configurez les informations de votre concession.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Nom de la concession</Label>
                <Input placeholder="Garage Moreau Automobiles" defaultValue="Garage Moreau Automobiles" />
              </div>
              <div className="space-y-2">
                <Label>Ville</Label>
                <Input placeholder="Lyon" defaultValue="Lyon" />
              </div>
              <div className="space-y-2">
                <Label>Logiciel de gestion</Label>
                <Input placeholder="IDS / Dcsys / Kerridge" defaultValue="IDS" />
              </div>
              <div className="space-y-2">
                <Label>Téléphone</Label>
                <Input placeholder="04 72 00 00 00" />
              </div>
            </div>
            <Button variant="outline" className="shadow-sm">
              Enregistrer les paramètres
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Abonnement
            </CardTitle>
            <CardDescription>Gérez votre formule et suivez votre consommation.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 p-4 border rounded-lg bg-primary/5 border-primary/10">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium">Formule actuelle</p>
                  <Badge variant="outline" className="text-xs">Essentiel</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Rappels Auto — 179€/mois
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Prochaine facture</p>
                <p className="font-medium">15 juin 2025</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" className="rounded-full">
                <Send className="h-4 w-4 mr-2" />
                Passer au Pack Complet
              </Button>
              <p className="text-sm text-muted-foreground">
                Économisez 49€/mois avec les deux modules.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-destructive/20 bg-destructive/5">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Zone de Danger
            </CardTitle>
            <CardDescription>Actions irréversibles sur votre compte.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-4 p-4 border border-destructive/20 rounded-lg bg-background">
              <div className="space-y-2 flex-1">
                <h4 className="font-semibold text-foreground">Supprimer le compte</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Conformément au <strong>RGPD</strong>, vous disposez d'un droit à l'effacement. La suppression de votre compte entraînera la suppression définitive de toutes vos données personnelles de nos serveurs.
                </p>
                <div className="flex items-center gap-2 p-2 rounded-md bg-secondary/50 border border-border/40 text-xs text-muted-foreground">
                  <Info className="h-4 w-4 shrink-0" />
                  <span>Cette action est immédiate et irréversible.</span>
                </div>
              </div>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="shrink-0 shadow-lg shadow-destructive/20">
                    Supprimer mon compte
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="max-w-md">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                      Suppression définitive
                    </AlertDialogTitle>
                    <AlertDialogDescription className="space-y-4 pt-2">
                      <p className="font-medium text-foreground">
                        Êtes-vous sûr de vouloir supprimer votre compte ?
                      </p>
                      {profile?.is_subscriber ? (
                        <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium">
                          Vous avez un abonnement actif. Veuillez d'abord le résilier depuis l'onglet "Facturation" avant de pouvoir supprimer votre compte.
                        </div>
                      ) : (
                        <>
                          <p className="text-sm text-muted-foreground">
                            Toutes vos données seront supprimées conformément au RGPD. Cette action ne peut pas être annulée.
                          </p>
                          <div className="space-y-2">
                            <Label htmlFor="confirm-delete" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                              Saisissez "SUPPRIMER" pour confirmer
                            </Label>
                            <Input 
                              id="confirm-delete"
                              placeholder="SUPPRIMER" 
                              value={deleteConfirmText}
                              onChange={(e) => setDeleteConfirmText(e.target.value)}
                              className="border-destructive/30 focus-visible:ring-destructive"
                            />
                          </div>
                        </>
                      )}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setDeleteConfirmText("")}>Annuler</AlertDialogCancel>
                    {!profile?.is_subscriber && (
                      <AlertDialogAction
                        onClick={handleDeleteAccount}
                        disabled={deleteConfirmText !== "SUPPRIMER" || isDeleting}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-lg shadow-destructive/20"
                      >
                        {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Confirmer la suppression
                      </AlertDialogAction>
                    )}
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
