import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Car, Wrench, Bot, TrendingUp } from "lucide-react";

export default function Billing() {
  const { profile } = useAuth();

  const plans = [
    {
      name: "Rappels Auto",
      price: "179 €",
      description: "Pour commencer avec les rappels clients automatiques.",
      features: [
        "Rappels contrôle technique 30 et 7 jours avant",
        "Rappel automatique quand l'entretien approche",
        "Proposition de rachat de véhicule au bon moment",
        "Tableau de bord : combien de clients reviennent à l'atelier",
        "Compatible avec votre logiciel de gestion",
        "Messages automatiques par SMS et email",
      ],
      icon: Wrench,
      current: !profile?.is_subscriber,
      recommended: false,
      badge: "Essentiel",
    },
    {
      name: "Pack Complet",
      price: "299 €",
      description: "Les deux modules réunis. Économisez 59 €/mois.",
      features: [
        "Toutes les fonctionnalités Rappels Auto + Réponse Clients",
        "Historique complet de chaque client",
        "Relanco vous dit quand un client est prêt à racheter",
        "Rapport mensuel de résultats",
        "Messages rédigés automatiquement par l'IA",
        "Moins de 6% de résiliations par an",
      ],
      icon: TrendingUp,
      current: !!profile?.is_subscriber,
      recommended: true,
      badge: "Complet — Recommandé",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Abonnement</h1>
        <p className="text-muted-foreground">Gérez votre plan et suivez votre résultat.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {plans.map((plan) => (
          <Card key={plan.name} className={plan.recommended ? "border-primary shadow-md relative overflow-hidden" : ""}>
            {plan.recommended && (
              <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider">
                Actuel
              </div>
            )}
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <plan.icon className="h-5 w-5" />
                  {plan.name}
                </div>
                {plan.current && <Badge variant="secondary">Plan Actuel</Badge>}
              </CardTitle>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-bold">{plan.price}</span>
                <span className="text-muted-foreground">/mois</span>
              </div>
              <CardDescription className="mt-2">{plan.description}</CardDescription>
              <div className={`mt-2 inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${plan.recommended ? 'bg-primary/10 text-primary' : 'bg-emerald-500/10 text-emerald-500'}`}>
                {plan.badge}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <ul className="space-y-3 text-sm">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button 
                className="w-full" 
                variant={plan.current ? "outline" : "default"}
                disabled={plan.current}
              >
                {plan.current ? "Plan actuel" : `Passer à ${plan.name}`}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-dashed border-border/50 bg-secondary/5">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <Car className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Passer au Pack Complet</h3>
              <p className="text-sm text-muted-foreground">
                Le pack à 299€/mois réunit les deux modules. Économisez 49€/mois.
                Moins de 6% de résiliations, résultat moyen 5x.
              </p>
            </div>
            <Button variant="outline" className="rounded-full">
              Me notifier
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
