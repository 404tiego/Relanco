import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-border/60 shadow-lg">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
            <FileQuestion className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-3xl font-display font-bold">404</CardTitle>
          <h2 className="text-xl font-semibold">Page introuvable</h2>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <p className="text-muted-foreground">
            Désolé, la page que vous recherchez n'existe pas ou a été déplacée.
          </p>
          <Link href="/">
            <Button className="w-full rounded-full">
              Retour à l'accueil
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
