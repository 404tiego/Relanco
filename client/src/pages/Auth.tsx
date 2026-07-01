import { useState } from "react";
import { useLocation, Link } from "wouter";
import { hasSupabaseClientEnv, supabase } from "@/hooks/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Eye, EyeOff, Car } from "lucide-react";
import { SiGoogle } from "react-icons/si";
import { translateSupabaseError } from "@/lib/error-translator";

export default function AuthPage() {
  const [location, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptedTOS, setAcceptedTOS] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const isLogin = location === "/login";

  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: "", color: "bg-muted" };
    if (pass.length < 6) return { score: 1, label: "Trop court", color: "bg-destructive" };
    
    let score = 1;
    if (pass.length > 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    
    if (score <= 2) return { score: 2, label: "Faible", color: "bg-orange-500" };
    if (score <= 3) return { score: 3, label: "Moyenne", color: "bg-yellow-500" };
    if (score <= 4) return { score: 4, label: "Forte", color: "bg-green-500" };
    return { score: 5, label: "Excellente", color: "bg-emerald-600" };
  };

  const strength = getPasswordStrength(password);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsLoading(true);

    try {
      if (!isLogin && password !== confirmPassword) {
        throw new Error("Les mots de passe ne correspondent pas.");
      }

      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast({ title: "Bon retour !", description: "Connexion réussie." });
      } else {
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
            has_accepted_terms: true,
          }),
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => ({ message: "Registration failed" }));
          throw new Error(payload.message || "Registration failed");
        }

        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        toast({ title: "Compte créé", description: "Votre compte a été créé avec succès." });
      }
    } catch (error: any) {
      const translated = translateSupabaseError(error);
      toast({
        variant: "destructive",
        title: translated.title,
        description: translated.description,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    try {
      if (!hasSupabaseClientEnv) {
        throw new Error(
          "Configuration Supabase manquante dans le frontend (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY). Vérifie les Secrets Replit et redémarre complètement le Repl.",
        );
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/app`,
        },
      });
      if (error) throw error;
    } catch (error: any) {
      const translated = translateSupabaseError(error);
      toast({
        variant: "destructive",
        title: translated.title,
        description: translated.description,
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary/30 p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 p-2 rounded-lg">
              <Car className="w-6 h-6 text-primary" />
            </div>
            <span className="font-display font-bold text-2xl tracking-tight">Relanco</span>
          </div>
        </div>

        <Card className="w-full shadow-2xl shadow-black/5 border-border/60">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-display font-bold text-center">
              {isLogin ? "Connexion" : "Créer un compte"}
            </CardTitle>
            <CardDescription className="text-center">
              {isLogin 
                ? "Accédez à votre tableau de bord concession" 
                : "Inscrivez votre concession pour commencer"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button 
                type="button"
                variant="outline" 
                className="w-full h-11 text-base font-semibold"
                onClick={handleGoogleAuth}
                disabled={isLoading}
                data-testid="button-google-auth"
              >
                <SiGoogle className="mr-2 h-5 w-5" />
                {isLogin ? "Se connecter avec Google" : "S'inscrire avec Google"}
              </Button>

              <Separator className="my-4" />

              <form onSubmit={handleAuth} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="directeur@concession.fr"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-11"
                    data-testid="input-email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Mot de passe</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="h-11 pr-10"
                      data-testid="input-password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-foreground no-default-hover-elevate no-default-active-elevate"
                      onClick={() => setShowPassword(!showPassword)}
                      data-testid="button-toggle-password"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {!isLogin && password && (
                    <div className="space-y-1.5 mt-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground">Robustesse:</span>
                        <span className="font-medium">{strength.label}</span>
                      </div>
                      <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${strength.color}`}
                          style={ { width: `${(strength.score / 5) * 100}%` } }
                        />
                      </div>
                    </div>
                  )}
                </div>
                {!isLogin && (
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirmer le mot de passe</Label>
                    <div className="relative">
                      <Input
                        id="confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className="h-11 pr-10"
                        data-testid="input-confirm-password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-foreground no-default-hover-elevate no-default-active-elevate"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        data-testid="button-toggle-confirm-password"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    {confirmPassword && confirmPassword !== password && (
                      <p className="text-xs text-destructive">Les mots de passe ne correspondent pas.</p>
                    )}
                  </div>
                )}
                <Button 
                  type="submit" 
                  className="w-full h-11 text-base font-semibold shadow-lg shadow-primary/20" 
                  disabled={isLoading}
                  data-testid="button-auth-submit"
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isLogin ? "Se connecter" : "Créer mon compte"}
                </Button>
              </form>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button 
              variant="ghost" 
              onClick={() => setLocation(isLogin ? "/register" : "/login")}
              className="text-muted-foreground hover:text-primary transition-colors h-auto p-0 hover:bg-transparent"
            >
              {isLogin ? "Pas encore de compte ? S'inscrire" : "Déjà un compte ? Se connecter"}
            </Button>
          </CardFooter>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          En vous inscrivant, vous acceptez de recevoir des informations sur Relanco.
          Essai gratuit 14 jours, sans engagement.
        </p>
      </div>
    </div>
  );
}
