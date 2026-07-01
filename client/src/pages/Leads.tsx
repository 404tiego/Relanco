import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Bot, Search, MessageSquare, Phone, CheckCircle2, Clock, Car, User } from "lucide-react";

const mockLeads = [
  {
    id: "1",
    name: "Pierre Dubois",
    email: "pierre.dubois@email.com",
    phone: "06 12 34 56 78",
    source: "Site Internet",
    vehicle: "Peugeot 3008",
    status: "Qualifié",
    priority: "Haute",
    type: "acheteur" as const,
    budget: "22 000 €",
    delai: "< 2 semaines",
    reprise: "Oui — Clio 2018",
    lastContact: "Il y a 2h",
    qualified: true,
  },
  {
    id: "2",
    name: "Marie Laurent",
    email: "marie.laurent@email.com",
    phone: "07 23 45 67 89",
    source: "Leboncoin",
    vehicle: "Renault Clio",
    status: "En attente",
    priority: "Moyenne",
    type: "vendeur" as const,
    km: "45 000 km",
    annee: "2020",
    prixSouhaite: "Non précisé",
    lastContact: "Il y a 5h",
    qualified: false,
  },
  {
    id: "3",
    name: "Jean Moreau",
    email: "jean.moreau@email.com",
    phone: "06 34 56 78 90",
    source: "Parcours Client",
    vehicle: "BMW Série 3",
    status: "Qualifié",
    priority: "Haute",
    type: "achat_vente" as const,
    budget: "35 000 €",
    delai: "< 1 mois",
    reprise: "Oui — 118i 2019",
    km: "62 000 km",
    lastContact: "Il y a 30 min",
    qualified: true,
  },
  {
    id: "4",
    name: "Sophie Bernard",
    email: "sophie.bernard@email.com",
    phone: "07 45 67 89 01",
    source: "Site Internet",
    vehicle: "Citroën C4",
    status: "À rappeler",
    priority: "Basse",
    type: "vendeur" as const,
    km: "78 000 km",
    annee: "2018",
    prixSouhaite: "12 000 €",
    lastContact: "Il y a 1 jour",
    qualified: false,
  },
  {
    id: "5",
    name: "Lucas Petit",
    email: "lucas.petit@email.com",
    phone: "06 56 78 90 12",
    source: "Leboncoin",
    vehicle: "Dacia Duster",
    status: "Qualifié",
    priority: "Haute",
    type: "acheteur" as const,
    budget: "18 000 €",
    delai: "< 3 semaines",
    reprise: "Non",
    lastContact: "Il y a 1h",
    qualified: true,
  },
];

function getTypeBadge(type: string) {
  switch (type) {
    case "acheteur":
      return { label: "Acheteur", className: "bg-blue-500/10 text-blue-500" };
    case "vendeur":
      return { label: "Vendeur", className: "bg-emerald-500/10 text-emerald-500" };
    case "achat_vente":
      return { label: "Achat + Vente", className: "bg-primary/10 text-primary" };
    default:
      return { label: "Acheteur", className: "bg-blue-500/10 text-blue-500" };
  }
}

export default function Leads() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "acheteur" | "vendeur" | "achat_vente" | "urgent" | "archive">("all");
  const [selectedLead, setSelectedLead] = useState<typeof mockLeads[0] | null>(null);

  const filtered = mockLeads.filter((l) => {
    const matchesSearch =
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.vehicle.toLowerCase().includes(search.toLowerCase());
    const matchesFilter =
      filter === "all"
        ? true
        : filter === "acheteur"
        ? l.type === "acheteur"
        : filter === "vendeur"
        ? l.type === "vendeur"
        : filter === "achat_vente"
        ? l.type === "achat_vente"
        : filter === "urgent"
        ? l.priority === "Haute"
        : false;
    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: mockLeads.length,
    acheteurs: mockLeads.filter((l) => l.type === "acheteur").length,
    vendeurs: mockLeads.filter((l) => l.type === "vendeur").length,
    achatVente: mockLeads.filter((l) => l.type === "achat_vente").length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Demandes clients</h1>
        <p className="text-muted-foreground">
          Les demandes entrantes qualifiées automatiquement par l'agent IA — acheteurs et vendeurs.
        </p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <MessageSquare className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total demandes</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-blue-500/10">
                <Car className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Acheteurs</p>
                <p className="text-2xl font-bold">{stats.acheteurs}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-emerald-500/10">
                <User className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Vendeurs</p>
                <p className="text-2xl font-bold">{stats.vendeurs}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <CheckCircle2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Achat + Vente</p>
                <p className="text-2xl font-bold">{stats.achatVente}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              Liste des demandes
            </CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  className="pl-9 w-64"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Button variant={filter === "all" ? "default" : "outline"} size="sm" onClick={() => setFilter("all")}>
                Tous
              </Button>
              <Button variant={filter === "urgent" ? "default" : "outline"} size="sm" onClick={() => setFilter("urgent")}>
                Urgents
              </Button>
              <Button variant={filter === "acheteur" ? "default" : "outline"} size="sm" onClick={() => setFilter("acheteur")}>
                Acheteurs
              </Button>
              <Button variant={filter === "vendeur" ? "default" : "outline"} size="sm" onClick={() => setFilter("vendeur")}>
                Vendeurs
              </Button>
              <Button variant={filter === "achat_vente" ? "default" : "outline"} size="sm" onClick={() => setFilter("achat_vente")}>
                En veille
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filtered.map((lead) => {
              const typeBadge = getTypeBadge(lead.type);
              return (
                <div
                  key={lead.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border/50 hover:bg-secondary/30 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-sm text-primary">
                      {lead.name.split(" ").map((n) => n[0]).join("")}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{lead.name}</span>
                        <Badge variant={lead.qualified ? "default" : "secondary"} className="text-xs">
                          {lead.status}
                        </Badge>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${typeBadge.className}`}>
                          {typeBadge.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground mt-0.5">
                        <span>{lead.vehicle}</span>
                        <span>•</span>
                        <span>{lead.source}</span>
                        <span>•</span>
                        <span>{lead.lastContact}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm">
                      <Phone className="h-4 w-4 mr-1" />
                      Appeler
                    </Button>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" onClick={() => setSelectedLead(lead)}>
                          Voir détail
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-lg">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <span>{lead.name}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${typeBadge.className}`}>
                              {typeBadge.label}
                            </span>
                          </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 pt-2">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground">Téléphone</p>
                              <p className="text-sm font-medium">{lead.phone}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground">Email</p>
                              <p className="text-sm font-medium">{lead.email}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground">Source</p>
                              <p className="text-sm font-medium">{lead.source}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground">Statut</p>
                              <p className="text-sm font-medium">{lead.status}</p>
                            </div>
                          </div>
                          <div className="border-t border-border/50 pt-3">
                            <p className="text-xs text-muted-foreground mb-2">Véhicule</p>
                            <p className="text-sm font-medium">{lead.vehicle}</p>
                          </div>
                          {lead.type === "acheteur" && (
                            <div className="space-y-2">
                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <p className="text-xs text-muted-foreground">Budget</p>
                                  <p className="text-sm font-medium">{lead.budget}</p>
                                </div>
                                <div className="space-y-1">
                                  <p className="text-xs text-muted-foreground">Délai</p>
                                  <p className="text-sm font-medium">{lead.delai}</p>
                                </div>
                              </div>
                              <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">Vente / Achat simultané</p>
                                <p className="text-sm font-medium">{lead.reprise}</p>
                              </div>
                            </div>
                          )}
                          {lead.type === "vendeur" && (
                            <div className="space-y-2">
                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <p className="text-xs text-muted-foreground">Kilométrage</p>
                                  <p className="text-sm font-medium">{lead.km}</p>
                                </div>
                                <div className="space-y-1">
                                  <p className="text-xs text-muted-foreground">Année</p>
                                  <p className="text-sm font-medium">{lead.annee}</p>
                                </div>
                              </div>
                              <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">Prix souhaité / Estimation</p>
                                <p className="text-sm font-medium">{lead.prixSouhaite}</p>
                              </div>
                            </div>
                          )}
                          {lead.type === "achat_vente" && (
                            <div className="space-y-2">
                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <p className="text-xs text-muted-foreground">Budget</p>
                                  <p className="text-sm font-medium">{lead.budget}</p>
                                </div>
                                <div className="space-y-1">
                                  <p className="text-xs text-muted-foreground">Délai</p>
                                  <p className="text-sm font-medium">{lead.delai}</p>
                                </div>
                              </div>
                              <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">Véhicule à vendre</p>
                                <p className="text-sm font-medium">{lead.reprise}</p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">Kilométrage véhicule actuel</p>
                                <p className="text-sm font-medium">{lead.km}</p>
                              </div>
                            </div>
                          )}
                          <div className="border-t border-border/50 pt-3">
                            <p className="text-xs text-muted-foreground mb-2">Action recommandée</p>
                            <div className="flex gap-2">
                              <Button size="sm">
                                <Phone className="h-4 w-4 mr-1" />
                                Rappeler
                              </Button>
                              <Button variant="outline" size="sm">
                                Marquer comme traité
                              </Button>
                            </div>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
