import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wrench, Send, Calendar, CheckCircle2, Clock, AlertTriangle, Mail, MessageSquare } from "lucide-react";

const mockRelances = [
  {
    id: "1",
    client: "Pierre Dubois",
    vehicle: "Peugeot 3008",
    type: "Contrôle technique",
    dueDate: "12 juin 2025",
    daysLeft: 10,
    status: "En attente",
    channel: "SMS",
    sent: false,
  },
  {
    id: "2",
    client: "Marie Laurent",
    vehicle: "Renault Clio",
    type: "Entretien",
    dueDate: "15 septembre 2025",
    daysLeft: 45,
    status: "Programmé",
    channel: "Email",
    sent: false,
  },
  {
    id: "3",
    client: "Sophie Bernard",
    vehicle: "Citroën C4",
    type: "Contrôle technique",
    dueDate: "10 décembre 2025",
    daysLeft: 120,
    status: "En attente",
    channel: "SMS",
    sent: false,
  },
  {
    id: "4",
    client: "Lucas Petit",
    vehicle: "Dacia Duster",
    type: "Proposition rachat",
    dueDate: "5 mars 2026",
    daysLeft: 180,
    status: "Qualifié",
    channel: "Email",
    sent: true,
  },
  {
    id: "5",
    client: "Jean Moreau",
    vehicle: "BMW Série 3",
    type: "Entretien",
    dueDate: "28 juillet 2025",
    daysLeft: 60,
    status: "Programmé",
    channel: "SMS",
    sent: false,
  },
];

export default function Relances() {
  const [relances, setRelances] = useState(mockRelances);

  const handleSimulate = () => {
    setRelances((prev) =>
      prev.map((r) =>
        r.status === "En attente" && !r.sent
          ? { ...r, status: "Envoyé", sent: true }
          : r
      )
    );
  };

  const stats = {
    total: relances.length,
    pending: relances.filter((r) => r.status === "En attente").length,
    sent: relances.filter((r) => r.sent).length,
    scheduled: relances.filter((r) => r.status === "Programmé").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Relances Auto</h1>
          <p className="text-muted-foreground">
            Rappels automatiques : contrôle technique, entretien, propositions de rachat.
          </p>
        </div>
        <Button onClick={handleSimulate} className="rounded-full">
          <Send className="h-4 w-4 mr-2" />
          Simuler les relances
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total relances</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-orange-500/10">
                <Clock className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">En attente</p>
                <p className="text-2xl font-bold">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-blue-500/10">
                <Mail className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Envoyées</p>
                <p className="text-2xl font-bold">{stats.sent}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-emerald-500/10">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Programmées</p>
                <p className="text-2xl font-bold">{stats.scheduled}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-primary" />
            Liste des relances
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {relances.map((relance) => (
              <div
                key={relance.id}
                className="flex items-center justify-between p-4 rounded-lg border border-border/50 hover:bg-secondary/30 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    {relance.channel === "SMS" ? (
                      <MessageSquare className="h-4 w-4 text-primary" />
                    ) : (
                      <Mail className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{relance.client}</span>
                      <Badge
                        variant={
                          relance.status === "Envoyé"
                            ? "default"
                            : relance.status === "Programmé"
                            ? "secondary"
                            : "outline"
                        }
                        className="text-xs"
                      >
                        {relance.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground mt-0.5">
                      <span>{relance.type}</span>
                      <span>•</span>
                      <span>{relance.vehicle}</span>
                      <span>•</span>
                      <span>Échéance : {relance.dueDate}</span>
                      <span>•</span>
                      <span className={relance.daysLeft <= 30 ? "text-orange-500 font-medium" : ""}>
                        {relance.daysLeft} jours
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {relance.status === "En attente" && (
                    <Button variant="outline" size="sm">
                      <Send className="h-4 w-4 mr-1" />
                      Envoyer
                    </Button>
                  )}
                  {relance.status === "Envoyé" && (
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      Envoyé
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
