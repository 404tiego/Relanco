import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Users, Search, Car, Wrench, Calendar, Phone, UserPlus, Upload, X,
} from "lucide-react";

const clientFormSchema = z.object({
  first_name: z.string().min(1, "Prénom obligatoire"),
  last_name: z.string().min(1, "Nom obligatoire"),
  phone: z.string().regex(/^0[67]\d{8}$/, "Format : 06XXXXXXXX ou 07XXXXXXXX"),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  vehicle: z.string().optional(),
  purchase_date: z.string().optional(),
  client_type: z.string().min(1, "Type de client obligatoire"),
});

type ClientFormValues = z.infer<typeof clientFormSchema>;

interface ClientRecord {
  id: string;
  name: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  vehicle?: string;
  purchase_date?: string;
  client_type?: string;
  status?: string;
  last_visit?: string;
  next_ct?: string;
  next_service?: string;
  created_at?: string;
}

function AddClientModal({
  open, onClose, accessToken,
}: {
  open: boolean;
  onClose: () => void;
  accessToken?: string;
}) {
  const { toast } = useToast();
  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      phone: "",
      email: "",
      vehicle: "",
      purchase_date: "",
      client_type: "",
    },
  });

  const addMutation = useMutation({
    mutationFn: async (values: ClientFormValues) => {
      if (!accessToken) throw new Error("Non authentifié");
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          name: `${values.first_name} ${values.last_name}`,
          first_name: values.first_name,
          last_name: values.last_name,
          phone: values.phone,
          email: values.email || null,
          vehicle: values.vehicle || null,
          purchase_date: values.purchase_date || null,
          client_type: values.client_type,
        }),
      });
      if (!res.ok) throw new Error("Erreur lors de la création");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Client ajouté ✓", description: "Le client a été ajouté avec succès." });
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      form.reset();
      onClose();
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible d'ajouter le client.", variant: "destructive" });
    },
  });

  const onSubmit = (values: ClientFormValues) => {
    addMutation.mutate(values);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Ajouter un client
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prénom *</FormLabel>
                    <FormControl>
                      <Input placeholder="Jean" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="last_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom *</FormLabel>
                    <FormControl>
                      <Input placeholder="Dupont" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Téléphone *</FormLabel>
                  <FormControl>
                    <Input placeholder="0612345678" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="jean.dupont@email.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="vehicle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Véhicule</FormLabel>
                  <FormControl>
                    <Input placeholder="Renault Clio 2020" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="purchase_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date d'achat</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="client_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type de client *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Acheteur">Acheteur</SelectItem>
                        <SelectItem value="Vendeur">Vendeur</SelectItem>
                        <SelectItem value="Achat + Vente">Achat + Vente</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Annuler
              </Button>
              <Button type="submit" disabled={addMutation.isPending}>
                {addMutation.isPending ? "Ajout..." : "Ajouter le client"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function ImportCsvModal({
  open, onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [dragOver, setDragOver] = useState(false);
  const { toast } = useToast();

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith(".csv")) {
      toast({ title: "Fichier reçu", description: `${file.name} — import en cours (simulation).` });
    } else {
      toast({ title: "Format invalide", description: "Veuillez déposer un fichier CSV.", variant: "destructive" });
    }
  };

  const downloadTemplate = () => {
    const csv = "Prénom,Nom,Téléphone,Email,Véhicule,Date d'achat,Type\nJean,Dupont,0612345678,jean@test.com,Renault Clio 2020,2024-01-15,Acheteur";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "modele_clients_relanco.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            Importer des clients (CSV)
          </DialogTitle>
        </DialogHeader>
        <div
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
            dragOver ? "border-primary bg-primary/5" : "border-border"
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-medium mb-1">Glissez-déposez un fichier CSV</p>
          <p className="text-xs text-muted-foreground mb-4">ou cliquez pour sélectionner</p>
          <Button variant="outline" size="sm" onClick={downloadTemplate}>
            Télécharger le modèle CSV
          </Button>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function Clients() {
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const { user, session } = useAuth();

  const { data: clients, isLoading } = useQuery<ClientRecord[]>({
    queryKey: ["/api/clients"],
    queryFn: async () => {
      const token = session?.access_token;
      if (!token) throw new Error("Not authenticated");
      const res = await fetch("/api/clients", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch clients");
      return res.json();
    },
  });

  const filtered = (clients ?? []).filter(
    (c) =>
      (c.name?.toLowerCase() ?? "").includes(search.toLowerCase()) ||
      (c.vehicle?.toLowerCase() ?? "").includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Base clients</h1>
          <p className="text-muted-foreground">
            Historique complet de vos clients et véhicules.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="rounded-full" onClick={() => setImportOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Importer CSV
          </Button>
          <Button className="rounded-full" onClick={() => setAddOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Ajouter manuellement
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Clients actifs</p>
                <p className="text-2xl font-bold">{(clients ?? []).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-orange-500/10">
                <Calendar className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">CT ce mois</p>
                <p className="text-2xl font-bold">2</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-blue-500/10">
                <Wrench className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Entretiens à venir</p>
                <p className="text-2xl font-bold">3</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-emerald-500/10">
                <Car className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Véhicules suivis</p>
                <p className="text-2xl font-bold">{(clients ?? []).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Clients
            </CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un client..."
                className="pl-9 w-72"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Chargement...</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              Aucun client trouvé.
              <div className="mt-4">
                <Button onClick={() => setAddOpen(true)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Ajouter un client
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((client) => (
                <div key={client.id}>
                  <div
                    className="flex items-center justify-between p-4 rounded-lg border border-border/50 hover:bg-secondary/30 transition-colors cursor-pointer"
                    onClick={() => setExpanded(expanded === client.id ? null : client.id)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-sm text-primary">
                        {client.name?.split(" ").map((n) => n[0]).join("") ?? "?"}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{client.name}</span>
                          <Badge
                            variant={client.status === "Actif" ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {client.status ?? "Actif"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground mt-0.5">
                          <span className="flex items-center gap-1">
                            <Car className="h-3 w-3" />
                            {client.vehicle ?? "—"}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Prochain CT : {client.next_ct ?? "—"}
                          </span>
                          {client.client_type && (
                            <>
                              <span>•</span>
                              <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                                {client.client_type}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm">
                        <Phone className="h-4 w-4 mr-1" />
                        Appeler
                      </Button>
                      <Button variant="outline" size="sm">
                        {expanded === client.id ? "Réduire" : "Historique"}
                      </Button>
                    </div>
                  </div>
                  {expanded === client.id && (
                    <div className="mx-4 mb-3 p-4 bg-secondary/20 rounded-lg border border-border/30">
                      <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                        {client.phone && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {client.phone}
                          </div>
                        )}
                        {client.email && (
                          <div className="text-muted-foreground">{client.email}</div>
                        )}
                        {client.purchase_date && (
                          <div className="text-muted-foreground">
                            Achat : {client.purchase_date}
                          </div>
                        )}
                        {client.client_type && (
                          <div className="text-muted-foreground">
                            Type : {client.client_type}
                          </div>
                        )}
                      </div>
                      <h4 className="font-semibold text-sm mb-2">Historique</h4>
                      <div className="text-sm text-muted-foreground">
                        Aucun historique enregistré.
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AddClientModal open={addOpen} onClose={() => setAddOpen(false)} accessToken={session?.access_token} />
      <ImportCsvModal open={importOpen} onClose={() => setImportOpen(false)} />
    </div>
  );
}
