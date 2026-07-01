import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";

export default function Confidentialite() {
  return (
    <div className="min-h-screen bg-background py-20 px-4">
      <div className="max-w-3xl mx-auto space-y-8">
        <Link href="/" className="text-primary hover:underline">← Retour à l'accueil</Link>
        <h1 className="text-4xl font-display font-bold">Politique de Confidentialité</h1>
        
        <Card>
          <CardContent className="pt-6 space-y-4 text-muted-foreground">
            <section>
              <h2 className="text-xl font-bold text-foreground mb-2">1. Collecte des données</h2>
              <p>Nous collectons les informations que vous nous fournissez lors de votre inscription (email, nom). Les données de vos clients restent votre propriété exclusive.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground mb-2">2. Utilisation des données</h2>
              <p>Vos données sont utilisées exclusivement pour le bon fonctionnement de votre compte et de nos services.</p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
