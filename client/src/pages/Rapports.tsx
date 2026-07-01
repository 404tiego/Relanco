import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Download, Calendar, MessageSquare, CheckCircle2, Clock, Users, Car } from "lucide-react";

const mockReports = [
  {
    id: "1",
    month: "Mai 2025",
    leadsTotal: 47,
    leadsQualified: 32,
    relancesSent: 28,
    relancesReturned: 12,
    revenue: "18 400 €",
    status: "Généré",
  },
  {
    id: "2",
    month: "Avril 2025",
    leadsTotal: 42,
    leadsQualified: 28,
    relancesSent: 25,
    relancesReturned: 10,
    revenue: "15 200 €",
    status: "Généré",
  },
  {
    id: "3",
    month: "Mars 2025",
    leadsTotal: 38,
    leadsQualified: 25,
    relancesSent: 22,
    relancesReturned: 9,
    revenue: "13 800 €",
    status: "Généré",
  },
];

export default function Rapports() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Rapports mensuels</h1>
          <p className="text-muted-foreground">
            Suivi des résultats : leads qualifiés, relances et revenus générés.
          </p>
        </div>
        <Button variant="outline" className="rounded-full">
          <Download className="h-4 w-4 mr-2" />
          Télécharger le dernier rapport
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Leads ce mois</p>
                <p className="text-2xl font-bold">47</p>
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
                <p className="text-sm text-muted-foreground">Qualifiés</p>
                <p className="text-2xl font-bold">32</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-blue-500/10">
                <MessageSquare className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Relances retour</p>
                <p className="text-2xl font-bold">12</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Revenus estimés</p>
                <p className="text-2xl font-bold">18 400 €</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Historique des rapports
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockReports.map((report) => (
              <div
                key={report.id}
                className="flex items-center justify-between p-4 rounded-lg border border-border/50 hover:bg-secondary/30 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Calendar className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{report.month}</span>
                      <Badge variant="default" className="text-xs">
                        {report.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground mt-0.5">
                      <span>{report.leadsTotal} leads</span>
                      <span>•</span>
                      <span>{report.leadsQualified} qualifiés</span>
                      <span>•</span>
                      <span>{report.relancesSent} relances envoyées</span>
                      <span>•</span>
                      <span>{report.relancesReturned} retours</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-lg font-bold text-primary">{report.revenue}</span>
                  <Button variant="ghost" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-dashed border-border/50 bg-secondary/5">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <Car className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Prochain rapport</h3>
              <p className="text-sm text-muted-foreground">
                Le rapport de juin 2025 sera généré automatiquement le 1er juillet.
                Il inclura les leads qualifiés, les relances effectuées et les revenus estimés.
              </p>
            </div>
            <Button variant="outline" className="rounded-full">
              <Calendar className="h-4 w-4 mr-2" />
              Voir le calendrier
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
