import { useState, useRef, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, CheckCircle2, Bot, MessageSquare, Repeat, TrendingUp, Car, Gauge, Wrench, Sparkles, Zap, Users, BarChart2, Shield, Clock, Target, Database, Headset, Rocket, X, Send } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

interface ChatMessage {
  role: "user" | "agent";
  text: string;
}

function AgentChatModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "agent",
      text: "Bonjour ! Je suis l'assistant Relanco.\nVous souhaitez acheter un véhicule, vendre le vôtre, ou les deux ?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: userMsg }]);
    setIsLoading(true);
    try {
      const res = await fetch("/api/agent/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg,
          history: messages.filter((m) => m.role !== "agent" || m.text !== "Bonjour ! Je suis l'assistant Relanco.\nVous souhaitez acheter un véhicule, vendre le vôtre, ou les deux ?"),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessages((prev) => [
          ...prev,
          { role: "agent", text: `Désolé, une erreur est survenue : ${data.message || "Problème de connexion"}` },
        ]);
      } else {
        setMessages((prev) => [...prev, { role: "agent", text: data.response }]);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { role: "agent", text: "Désolé, je ne peux pas répondre pour le moment. Veuillez réessayer." },
      ]);
    }
    setIsLoading(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="w-full max-w-lg bg-[#0d0e12] border border-[#2A2D35] rounded-2xl shadow-2xl shadow-black/40 flex flex-col max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-[#2A2D35]">
              <div>
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Bot className="h-5 w-5 text-[#D4A843]" />
                  Testez l'agent Relanco en direct
                </h3>
                <p className="text-xs text-[#8B8F99] mt-0.5">
                  Simulez une demande client — achat ou vente de véhicule
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-[#2A2D35] transition-colors text-[#8B8F99]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[300px]">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm whitespace-pre-line leading-relaxed ${
                      msg.role === "user"
                        ? "bg-[#D4A843] text-[#08090A] rounded-br-md font-medium"
                        : "bg-[#16181C] text-white border border-[#2A2D35] rounded-bl-md"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-[#16181C] border border-[#2A2D35] rounded-2xl rounded-bl-md px-4 py-3">
                    <div className="flex gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#D4A843] animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-2 h-2 rounded-full bg-[#D4A843] animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-2 h-2 rounded-full bg-[#D4A843] animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-[#2A2D35]">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Écrivez votre message..."
                  className="flex-1 bg-[#16181C] border border-[#2A2D35] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-[#50545E] focus:outline-none focus:border-[#D4A843] focus:ring-1 focus:ring-[#D4A843]/30 transition-all"
                  disabled={isLoading}
                />
                <button
                  onClick={handleSend}
                  disabled={isLoading || !input.trim()}
                  className="bg-[#D4A843] hover:bg-[#c49a3d] text-[#08090A] rounded-xl px-4 py-2.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function FloatingHeader() {
  const { user } = useAuth();
  const [chatOpen, setChatOpen] = useState(false);

  const handleHeroScroll = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    const heroSection = document.getElementById("hero");
    heroSection?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.history.replaceState(null, "", "#hero");
  };

  return (
    <>
      <div className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
        <motion.header
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
          className="bg-background/80 backdrop-blur-xl border border-border/50 pointer-events-auto flex items-center justify-between px-6 py-3 rounded-full w-full max-w-5xl shadow-xl shadow-black/5"
        >
          <div className="flex items-center gap-2">
            <a
              href="#hero"
              onClick={handleHeroScroll}
              className="flex items-center gap-2 pointer-events-auto cursor-pointer hover:opacity-80 transition-opacity"
            >
              <div className="bg-primary/10 p-1.5 rounded-lg">
                <Car className="w-5 h-5 text-primary" />
              </div>
              <span className="font-display font-bold text-xl tracking-tight">Relanco</span>
            </a>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <a href="#features" className="hover:text-primary transition-colors">Fonctionnalités</a>
            <a href="#roadmap" className="hover:text-primary transition-colors">Comment ça marche</a>
            <a href="#pricing" className="hover:text-primary transition-colors">Tarifs</a>
            <a href="#faq" className="hover:text-primary transition-colors">FAQ</a>
          </nav>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full hidden sm:flex items-center gap-2 text-[#D4A843] hover:text-[#D4A843] hover:bg-[#D4A843]/10"
              onClick={() => setChatOpen(true)}
            >
              <Bot className="h-4 w-4" />
              Tester l'agent IA
            </Button>
            {user ? (
              <Link href="/app">
                <Button size="sm" className="rounded-full px-6">Tableau de Bord</Button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm" className="rounded-full hidden sm:flex">Connexion</Button>
                </Link>
                <Link href="/register">
                  <Button size="sm" className="rounded-full px-6 shadow-lg shadow-primary/20">Essai Gratuit 14 jours</Button>
                </Link>
              </>
            )}
          </div>
        </motion.header>
      </div>
      <AgentChatModal open={chatOpen} onClose={() => setChatOpen(false)} />
    </>
  );
}

export default function Landing() {
  const [isAnnual, setIsAnnual] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);

  const handleStripeCheckout = async (productKey: string) => {
    if (checkingOut) return;
    setCheckingOut(true);
    try {
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productKey }),
      });
      const data = await res.json();
      if (data.success && data.url) {
        window.location.href = data.url;
      } else {
        alert("Erreur de paiement : " + (data.message || "Problème de connexion"));
        setCheckingOut(false);
      }
    } catch (err) {
      alert("Erreur de paiement. Veuillez réessayer.");
      setCheckingOut(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1 } 
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  const sectionVariants = {
    hidden: { y: 40, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5, ease: "easeOut" }
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <FloatingHeader />

      {/* Hero Section */}
      <section id="hero" className="relative min-h-screen flex items-center justify-center px-4 pt-32">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-3xl -z-10" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent/10 rounded-full blur-3xl -z-10" />
        
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="text-center max-w-4xl mx-auto space-y-8"
        >
          <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 border border-border/50 text-sm font-medium text-muted-foreground">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            Nouveau — Relances Après-Vente Automatiques
          </motion.div>
          
          <motion.h1 variants={itemVariants} className="font-display text-5xl md:text-7xl font-bold leading-[1.1] tracking-tight text-balance">
            L'IA qui transforme les visites <br />
            <span className="text-gradient">atelier en revenus</span>
          </motion.h1>
          
          <motion.p variants={itemVariants} className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Relanco automatise les relances après-vente et qualifie vos leads entrants en 60 secondes. 
            Un seul cycle de données : du premier lead au 3ème achat.
          </motion.p>
          
          <motion.p variants={itemVariants} className="text-[13px] text-muted-foreground text-center mt-2">
            Compatible avec les réseaux de franchisés, groupes multi-sites et concessions indépendantes.
          </motion.p>
          
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link href="/register">
              <Button size="lg" className="rounded-full h-14 px-8 text-lg shadow-xl shadow-primary/25 btn-primary-gold">
                Essai Gratuit 14 Jours
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <a href="#roadmap">
              <Button size="lg" variant="outline" className="rounded-full h-14 px-8 text-lg">
                Voir la Roadmap
              </Button>
            </a>
          </motion.div>

          <motion.div variants={itemVariants} className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground pt-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              <span>Sans changement de logiciel</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              <span>Connexion à votre logiciel de gestion</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              <span>Opérationnel en 4-6 semaines</span>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Features Grid */}
      <motion.section
        id="features"
        className="py-24 md:py-32 px-4 bg-secondary/30"
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="font-display text-3xl md:text-4xl font-bold">Trois modules, un seul cycle</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Choisissez votre niveau selon vos besoins. Vous pouvez démarrer avec un seul module ou activer les trois dès le premier jour.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Wrench,
                title: "Relances Après-Vente",
                desc: "Rappels contrôle technique 30 et 7 jours avant (SMS + email). Rappel automatique quand l'entretien approche. Proposition de rachat de véhicule au bon moment. Tableau de bord : combien de clients reviennent à l'atelier.",
                badge: "Essentiel",
                color: "bg-emerald-500/10 text-emerald-500"
              },
              {
                icon: Bot,
                title: "Qualification des Leads",
                desc: "Réponse automatique en moins d'une minute, 7j/7 — qu'il s'agisse d'un acheteur qui cherche un véhicule ou d'un particulier qui veut vendre le sien. Chaque demande est qualifiée et transmise au bon interlocuteur dans votre équipe.",
                badge: "Avancé",
                color: "bg-blue-500/10 text-blue-500"
              },
              {
                icon: TrendingUp,
                title: "Pack Complet",
                desc: "Toutes les demandes clients reliées à l'historique de chaque client. Relanco vous dit quand un client est prêt à changer de véhicule. Rapport mensuel de résultats pour le directeur.",
                badge: "Complet — Recommandé",
                color: "bg-primary/10 text-primary"
              }
            ].map((feature, i) => (
              <div key={i} className="bg-card p-8 rounded-2xl border border-border/50 card-interactive group">
                <div className={`w-12 h-12 rounded-xl ${feature.color} flex items-center justify-center mb-4 card-icon-box group-hover:scale-110 group-hover:brightness-125`}>
                  <feature.icon className="w-6 h-6" />
                </div>
                <div className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-primary/10 text-primary mb-4">
                  {feature.badge}
                </div>
                <h3 className="font-display text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Why Relanco */}
      <motion.section
        className="py-24 md:py-32 px-4 relative overflow-hidden"
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl -z-10" />
        
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="font-display text-3xl md:text-4xl font-bold">Pourquoi Relanco ?</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Pas des outils isolés. Un système complet qui suit vos clients du premier contact jusqu'au prochain achat.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="space-y-6">
              {[
                { icon: MessageSquare, title: "Vos clients restent", desc: "Relanco garde l'historique complet de chaque client — du premier contact jusqu'au prochain achat. Rien ne se perd." },
                { icon: Repeat, title: "Un outil qui s'améliore tout seul", desc: "Plus vous utilisez Relanco, plus il devient précis. Chaque échange avec vos clients améliore les suivants." },
                { icon: Gauge, title: "Un seul interlocuteur", desc: "Tout au même endroit : rappels clients, demandes clients, historique. Un seul outil, une seule facture." },
              ].map((item, i) => (
                <div key={i} className="flex gap-4 advantage-card border border-border/50 p-4 rounded-xl bg-card">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 card-icon-box advantage-icon">
                    <item.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">{item.title}</h4>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="space-y-6">
              {[
                { icon: Sparkles, title: "Évolution simple", desc: "Démarrez par les rappels automatiques. Ajoutez la réponse aux demandes clients quand vous êtes prêt." },
                { icon: TrendingUp, title: "Un historique complet sur chaque client", desc: "L'historique entretiens, contrôles techniques et réparations de chaque client aide Relanco à mieux répondre aux nouvelles demandes clients." },
                { icon: Car, title: "Opérationnel en moins d'un mois", desc: "Opérationnel en 4 à 6 semaines. Pas besoin de changer vos habitudes — on se connecte par-dessus votre logiciel existant." },
              ].map((item, i) => (
                <div key={i} className="flex gap-4 advantage-card border border-border/50 p-4 rounded-xl bg-card">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 card-icon-box advantage-icon">
                    <item.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">{item.title}</h4>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.section>

      {/* Roadmap */}
      <motion.section
        id="roadmap"
        className="py-24 md:py-32 px-4 bg-secondary/30"
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="font-display text-3xl md:text-4xl font-bold">Comment ça marche</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Démarrez par ce dont vous avez besoin aujourd'hui. Ajoutez les autres modules quand vous voulez.
            </p>
          </div>

          <div className="space-y-8">
            {[
              {
                phase: "1",
                title: "Rappels clients automatiques",
                badge: "Disponible immédiatement",
                description: "La solution la plus simple pour démarrer. Se connecte à votre logiciel de gestion existant en 48h. Rappels contrôle technique, relance entretien, offre de rachat — tout automatique.",
                features: ["Rappels contrôle technique automatiques", "Rappel automatique quand l'entretien approche", "Proposition de rachat de véhicule au bon moment", "Tableau de bord : combien de clients reviennent à l'atelier"],
                price: "€179/mois",
                cta: "Commencer maintenant",
                active: true
              },
              {
                phase: "2",
                title: "Réponse aux demandes clients",
                badge: "Disponible immédiatement",
                description: "Activez la réponse automatique à toutes vos demandes clients entrantes. Vos clients actuels passent au module supérieur en un clic.",
                features: ["Réponse automatique en moins d'une minute, 7j/7", "Qualification automatique acheteurs et vendeurs", "Résumé transmis au bon interlocuteur", "Vos vendeurs savent qui rappeler en premier"],
                price: "€179/mois",
                cta: "Commencer maintenant",
                active: true
              },
              {
                phase: "3",
                title: "Pack Complet",
                badge: "Recommandé — Meilleure valeur",
                description: "Les deux modules réunis. Chaque client est suivi de sa première demande jusqu'à son prochain achat. Vos clients restent parce que Relanco connaît leur historique complet.",
                features: ["Historique complet de chaque client", "Relanco vous dit quand un client est prêt à racheter", "Rapport mensuel de résultats", "Messages rédigés automatiquement par l'IA"],
                price: "€299/mois",
                cta: "Choisir le Pack Complet",
                active: true,
                recommended: true
              }
            ].map((item, i) => (
              <div key={i} className="relative pl-8 md:pl-0">
                <div className="hidden md:flex items-start gap-6">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shrink-0 ${item.recommended ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                    {item.phase}
                  </div>
                  <div className={`flex-1 bg-card p-6 rounded-2xl border roadmap-card ${item.recommended ? 'roadmap-card-active border-primary/50' : 'roadmap-card-inactive border-border/50'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-display text-xl font-bold">{item.title}</h3>
                      <span className="text-sm font-medium text-primary">{item.price}</span>
                    </div>
                    <div className="mb-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${item.recommended ? 'bg-primary/10 text-primary' : 'bg-emerald-500/10 text-emerald-500'}`}>
                        {item.badge}
                      </span>
                    </div>
                    <p className="text-muted-foreground mb-4">{item.description}</p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {item.features.map((feature, j) => (
                        <span key={j} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                          {feature}
                        </span>
                      ))}
                    </div>
                    <Button
                      className={`rounded-full ${item.recommended ? 'btn-primary-gold' : ''}`}
                      variant={item.recommended ? 'default' : 'outline'}
                      disabled={checkingOut}
                      onClick={() => {
                        const productKey = item.phase === '1'
                          ? 'rappels_auto_monthly'
                          : item.phase === '2'
                          ? 'reponse_clients_monthly'
                          : 'pack_complet_monthly';
                        handleStripeCheckout(productKey);
                      }}
                    >
                      {item.cta}
                    </Button>
                    {item.recommended && (
                      <p className="text-xs text-muted-foreground mt-3">
                        Économisez €59/mois par rapport aux deux modules séparés.
                      </p>
                    )}
                  </div>
                </div>
                <div className="md:hidden">
                  <div className={`absolute left-0 top-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${item.recommended ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                    {item.phase}
                  </div>
                  <div className={`bg-card p-6 rounded-2xl border ${item.recommended ? 'border-primary/50' : 'border-border/50'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-display text-lg font-bold">{item.title}</h3>
                      <span className="text-sm font-medium text-primary">{item.price}</span>
                    </div>
                    <div className="mb-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${item.recommended ? 'bg-primary/10 text-primary' : 'bg-emerald-500/10 text-emerald-500'}`}>
                        {item.badge}
                      </span>
                    </div>
                    <p className="text-muted-foreground text-sm mb-4">{item.description}</p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {item.features.map((feature, j) => (
                        <span key={j} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                          {feature}
                        </span>
                      ))}
                    </div>
                    <Button
                      className="rounded-full w-full"
                      variant={item.recommended ? 'default' : 'outline'}
                      size="sm"
                      disabled={checkingOut}
                      onClick={() => {
                        const productKey = item.phase === '1'
                          ? 'rappels_auto_monthly'
                          : item.phase === '2'
                          ? 'reponse_clients_monthly'
                          : 'pack_complet_monthly';
                        handleStripeCheckout(productKey);
                      }}
                    >
                      {item.cta}
                    </Button>
                    {item.recommended && (
                      <p className="text-xs text-muted-foreground mt-3 text-center">
                        Économisez €59/mois par rapport aux deux modules séparés.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className="text-center text-[13px] text-muted-foreground mt-6 max-w-2xl mx-auto">
            Les trois modules sont disponibles immédiatement. La progression suggérée aide à une prise en main progressive — mais vous pouvez activer le Pack Complet dès le premier jour.
          </p>
        </div>
      </motion.section>

      {/* Pricing */}
      <motion.section
        id="pricing"
        className="py-24 md:py-32 px-4 relative overflow-hidden"
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl -z-10" />
        
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="font-display text-3xl md:text-4xl font-bold">Des tarifs alignés sur la valeur</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Trois formules disponibles dès aujourd'hui. Changez de formule à tout moment.
            </p>
          </div>

          {/* Toggle Mensuel / Annuel */}
          <div className="flex flex-col items-center mb-10">
            <div className="inline-flex items-center gap-1 bg-[#1C1E23] border border-white/[0.07] rounded-full p-1 relative">
              <button
                onClick={() => setIsAnnual(false)}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 ${!isAnnual ? 'bg-[#D4A843] text-[#08090A] font-bold shadow-[0_2px_12px_rgba(212,168,67,0.35)]' : 'text-[#50545E] hover:text-[#8B8F99]'}`}
              >
                Mensuel
              </button>
              <button
                onClick={() => setIsAnnual(true)}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 relative ${isAnnual ? 'bg-[#D4A843] text-[#08090A] font-bold shadow-[0_2px_12px_rgba(212,168,67,0.35)]' : 'text-[#50545E] hover:text-[#8B8F99]'}`}
              >
                Annuel
                {isAnnual && (
                  <span className="absolute -top-2.5 -right-2 bg-emerald-500 text-[#08090A] text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
                    2 mois offerts
                  </span>
                )}
              </button>
            </div>
            <AnimatePresence>
              {isAnnual && (
                <motion.p
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                  className="text-[13px] text-emerald-500 font-medium mt-3 text-center"
                >
                  🎁 Abonnement annuel — jusqu'à €720 économisés par an
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Rappels Auto",
                monthlyPrice: "€179",
                annualPrice: "€143",
                annualBilled: "facturé €1 718/an",
                annualSavings: "Économisez €430/an",
                description: "Pour commencer avec les rappels clients automatiques.",
                features: [
                  "Rappels contrôle technique 30 et 7 jours avant",
                  "Rappel automatique quand l'entretien approche",
                  "Proposition de rachat de véhicule au bon moment",
                  "Tableau de bord : combien de clients reviennent à l'atelier",
                  "Compatible avec votre logiciel de gestion",
                  "Messages automatiques par SMS et email",
                ],
                monthlyCta: "Commencer avec cette formule",
                annualCta: "Commencer — facturation annuelle",
                active: true,
              },
              {
                name: "Réponse Clients",
                monthlyPrice: "€179",
                annualPrice: "€143",
                annualBilled: "facturé €1 718/an",
                annualSavings: "Économisez €430/an",
                description: "Pour répondre automatiquement à toutes vos demandes — acheteurs et vendeurs particuliers.",
                features: [
                  "Réponse automatique en moins d'une minute, 7j/7",
                  "Qualification automatique acheteurs et vendeurs",
                  "Résumé transmis au bon interlocuteur",
                  "Vos vendeurs savent qui rappeler en premier",
                  "Compatible avec votre outil de suivi client",
                  "Messages clients rédigés par l'IA",
                ],
                monthlyCta: "Commencer avec cette formule",
                annualCta: "Commencer — facturation annuelle",
                active: true,
              },
              {
                name: "Pack Complet",
                monthlyPrice: "€299",
                annualPrice: "€239",
                annualBilled: "facturé €2 868/an",
                annualSavings: "Économisez €720/an",
                description: "Les deux modules réunis. Économisez €59/mois.",
                features: [
                  "Toutes les fonctionnalités Rappels Auto + Réponse Clients",
                  "Historique complet de chaque client",
                  "Relanco vous dit quand un client est prêt à racheter",
                  "Rapport mensuel de résultats",
                  "Messages rédigés automatiquement par l'IA",
                  "Moins de 6% de résiliations par an",
                ],
                monthlyCta: "Choisir le Pack Complet",
                annualCta: "Choisir le Pack Complet annuel",
                active: true,
                recommended: true,
              },
            ].map((plan, i) => (
              <div key={i} className={`bg-card p-8 rounded-2xl border ${plan.recommended ? 'pricing-card-accent border-[rgba(212,168,67,0.22)] shadow-[inset_0_0_40px_rgba(212,168,67,0.06),0_0_0_1px_rgba(212,168,67,0.22)]' : 'pricing-card-standard border-border/50'} relative cursor-pointer`}>
                {plan.recommended && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-4 py-1 rounded-full animate-[badge-pulse_2.5s_ease-in-out_infinite]">
                    RECOMMANDÉ
                  </div>
                )}
                <div className="mb-6">
                  <h3 className="font-display text-xl font-bold mb-2">{plan.name}</h3>
                  <p className="text-muted-foreground text-sm">{plan.description}</p>
                </div>
                <div className="mb-6">
                  <AnimatePresence mode="wait">
                    {isAnnual ? (
                      <motion.div
                        key="annual"
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 6 }}
                        transition={{ duration: 0.2 }}
                      >
                        <span className="text-[15px] text-[#50545E] line-through block">{plan.monthlyPrice}/mois</span>
                        <span className="font-mono text-[38px] font-bold text-[#F2F3F5]">{plan.annualPrice}</span>
                        <span className="text-[#8B8F99]">/mois</span>
                        <span className="text-[12px] text-[#50545E] block mt-1">{plan.annualBilled}</span>
                        <span className="inline-block mt-2 text-[12px] font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-3 py-1 rounded-full">
                          {plan.annualSavings}
                        </span>
                        {plan.recommended && (
                          <span className="text-[12px] text-[#50545E] line-through block mt-2">
                            Au lieu de €3 588/an séparément
                          </span>
                        )}
                      </motion.div>
                    ) : (
                      <motion.div
                        key="monthly"
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 6 }}
                        transition={{ duration: 0.2 }}
                      >
                        <span className="font-mono text-[38px] font-bold text-[#F2F3F5]">{plan.monthlyPrice}</span>
                        <span className="text-[#8B8F99]">/mois</span>
                        <span className="text-[12px] text-[#50545E] block mt-1">par mois, sans engagement</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className={`w-full rounded-full ${plan.recommended ? 'btn-primary-gold' : ''}`}
                  variant={plan.recommended ? 'default' : 'outline'}
                  disabled={checkingOut}
                  onClick={() => {
                    const productKey = plan.name === 'Rappels Auto'
                      ? (isAnnual ? 'rappels_auto_annual' : 'rappels_auto_monthly')
                      : plan.name === 'Réponse Clients'
                      ? (isAnnual ? 'reponse_clients_annual' : 'reponse_clients_monthly')
                      : (isAnnual ? 'pack_complet_annual' : 'pack_complet_monthly');
                    handleStripeCheckout(productKey);
                  }}
                >
                  {isAnnual ? plan.annualCta : plan.monthlyCta}
                </Button>
              </div>
            ))}
          </div>

          <div className="text-center mt-6 text-[12px] text-muted-foreground">
            {isAnnual
              ? "Paiement annuel en une fois • Essai gratuit 14 jours • Remboursé si non satisfait sous 30 jours"
              : "Tous les modules disponibles immédiatement • Essai gratuit 14 jours • Sans engagement • Résiliable à tout moment"
            }
          </div>
        </div>
      </motion.section>

      {/* FAQ */}
      <motion.section
        id="faq"
        className="py-24 md:py-32 px-4 bg-secondary/30"
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="font-display text-3xl md:text-4xl font-bold">Questions Fréquentes</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Réponses directes aux vraies questions des directeurs de concession.
            </p>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            {[
              {
                question: "Combien de temps pour le setup ?",
                answer: "Entre 4 et 6 semaines pour le module Relances Après-Vente. Pas besoin de changer votre logiciel de gestion existant. On se connecte par-dessus."
              },
              {
                question: "Mon logiciel de gestion est-il compatible ?",
                answer: "Relanco fonctionne avec les principaux logiciels de gestion automobile : IDS, Dcsys, Kerridge, CDK. Pour les autres, un simple fichier Excel suffit à démarrer."
              },
              {
                question: "Puis-je commencer par un seul module ?",
                answer: "Oui, c'est même ce qu'on recommande. Démarrez par les rappels automatiques à 179€/mois. Vous ajoutez la réponse aux demandes clients quand vous voyez les résultats."
              },
              {
                question: "Les données de mes clients sont-elles sécurisées ?",
                answer: "Vos données sont hébergées en France (OVH), chiffrées au repos et en transit. Conformité RGPD totale. Vous restez propriétaire de vos données à 100%."
              },
              {
                question: "Quel est le ROI moyen ?",
                answer: "En moyenne, nos concessions récupèrent 15 à 27% de leads perdus le premier mois. Le module after-sales génère un retour moyen de 8x le coût de l'abonnement en revenus atelier récupérés."
              },
              {
                question: "Relanco gère-t-il aussi les demandes de vente de particuliers ?",
                answer: "Oui. En plus des acheteurs, Relanco répond automatiquement aux particuliers qui souhaitent vendre ou faire estimer leur véhicule. Chaque demande est identifiée, qualifiée et transmise au bon interlocuteur dans votre équipe."
              },
            ].map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="bg-card border border-border/50 rounded-xl px-6 faq-item">
                <AccordionTrigger className="text-left font-semibold hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </motion.section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-border/50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 p-1.5 rounded-lg">
              <Car className="w-5 h-5 text-primary" />
            </div>
            <span className="font-display font-bold text-lg">Relanco</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="/mentions-legales" className="hover:text-primary transition-colors">Mentions Légales</Link>
            <Link href="/cgu" className="hover:text-primary transition-colors">CGU</Link>
            <Link href="/confidentialite" className="hover:text-primary transition-colors">Confidentialité</Link>
          </div>
          <div className="text-sm text-muted-foreground">
            © 2025 Relanco. Tous droits réservés.
          </div>
        </div>
      </footer>
    </div>
  );
}
