import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-supabase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Car, Wrench, Bot, MessageSquare, TrendingUp, ArrowRight, Gauge } from "lucide-react";
import { motion } from "framer-motion";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1 }
};

export default function Dashboard() {
  const { user } = useAuth();
  const { data: profile, isLoading } = useProfile();

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight">Tableau de Bord</h1>
          <p className="text-muted-foreground text-lg">
            Bienvenue, {profile?.full_name || profile?.email || user?.email}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
      >
        {[
          { label: "Messages envoyés", value: "0", icon: MessageSquare, sub: "Ce mois", color: "text-blue-500" },
          { label: "Retours atelier", value: "0", icon: Wrench, sub: "Ce mois", color: "text-emerald-500" },
          { label: "Demandes qualifiées", value: "0", icon: Bot, sub: "Ce mois", color: "text-purple-500" },
          { label: "Taux conversion", value: "0%", icon: TrendingUp, sub: "Ce mois", color: "text-amber-500" },
        ].map((stat, i) => (
          <motion.div key={i} variants={item}>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{stat.sub}</p>
                  </div>
                  <div className={`p-3 rounded-lg bg-secondary ${stat.color}`}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Quick Setup / Onboarding */}
      <Card className="border-dashed border-border/50 bg-secondary/5">
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="p-4 rounded-xl bg-primary/10">
              <Car className="h-8 w-8 text-primary" />
            </div>
            <div className="flex-1 space-y-3">
              <h2 className="text-xl font-semibold">Bienvenue sur Relanco</h2>
              <p className="text-muted-foreground max-w-xl">
                Votre concession est prête à automatiser les relances après-vente. 
                Connectez votre logiciel de gestion pour commencer à générer des revenus.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-500">
                  <Gauge className="w-3 h-3 mr-1" />
                  Essentiel — Relances Auto
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                  <Wrench className="w-3 h-3 mr-1" />
                  Logiciel de gestion non connecté
                </span>
              </div>
            </div>
            <Button className="rounded-full shadow-lg shadow-primary/20">
              Configurer le logiciel de gestion
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Features Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-blue-500" />
              Relances Après-Vente
            </CardTitle>
            <CardDescription>Automatisez les rappels contrôle technique et entretiens.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {[
                { label: "Rappel contrôle technique J-30", status: "Non configuré", active: false },
                { label: "Rappel contrôle technique J-7", status: "Non configuré", active: false },
                { label: "Relance entretien au km", status: "Non configuré", active: false },
                { label: "Offre de rachat", status: "Non configuré", active: false },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg border">
                  <span className="text-sm font-medium">{item.label}</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${item.active ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"}`}>
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-purple-500" />
              Réponse aux demandes
            </CardTitle>
            <CardDescription>Réponse IA aux demandes clients entrantes.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {[
                { label: "Réponse automatique <60s", status: "Disponible", active: true },
                { label: "Qualification acheteurs et vendeurs", status: "Disponible", active: true },
                { label: "Fiche transmise au bon interlocuteur", status: "Disponible", active: true },
                { label: "Classement par urgence", status: "Disponible", active: true },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg border">
                  <span className="text-sm font-medium">{item.label}</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${item.active ? "bg-emerald-500/10 text-emerald-500" : "bg-muted text-muted-foreground"}`}>
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
