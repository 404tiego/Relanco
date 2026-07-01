import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";

export default function CGU() {
  return (
    <div className="min-h-screen bg-background py-20 px-4">
      <div className="max-w-3xl mx-auto space-y-8">
        <Link href="/" className="text-primary hover:underline">← Retour à l'accueil</Link>
        <h1 className="text-4xl font-display font-bold">Conditions Générales d'Utilisation</h1>
        
        <Card>
          <CardContent className="pt-6 space-y-4 text-muted-foreground">
            <section>
              <h2 className="text-xl font-bold text-foreground mb-2">1. Objet</h2>
              <p>Les présentes CGU ont pour objet l'encadrement juridique des modalités de mise à disposition du site Relanco et de ses services d'automatisation pour concessions automobiles.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground mb-2">2. Accès aux services</h2>
              <p>Tout utilisateur ayant accès à internet peut accéder gratuitement au site depuis n'importe où.</p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
