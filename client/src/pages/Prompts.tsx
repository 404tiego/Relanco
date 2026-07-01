import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Copy, Check, Zap, Target, BookOpen, Variable, Shield, Wrench, Bot } from "lucide-react";

function CopyBlock({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text.trim());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };
  return (
    <div className="rounded-lg border border-border/50 bg-slate-950 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/30 bg-slate-900/50">
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{label}</span>
        <Button variant="ghost" size="sm" className="h-6 text-[11px]" onClick={handleCopy}>
          {copied ? <Check className="h-3 w-3 mr-1 text-emerald-500" /> : <Copy className="h-3 w-3 mr-1" />}
          {copied ? "Copié" : "Copier"}
        </Button>
      </div>
      <ScrollArea className="h-[300px]">
        <pre className="p-4 text-[11px] font-mono text-slate-200 leading-relaxed whitespace-pre-wrap">{text}</pre>
      </ScrollArea>
    </div>
  );
}

const systemPromptSkeleton = `## IDENTITÉ
Tu es [NOM_AGENT], l'assistant IA de la concession [NOM_CONCESSION].

## MISSION PRINCIPALE
Module A — Qualification des leads entrants
Module B — Relances après-vente automatisées

## CONTEXTE MÉTIER
Informations sur la concession, les véhicules, les règles tarifaires...

## RÈGLES DE COMPORTEMENT
Ton, format, longueur, escalade humaine...

## WORKFLOWS
Étapes exactes pour chaque type d'interaction...

## VARIABLES DISPONIBLES
Liste des données injectées dynamiquement...

## GARDE-FOUS
Ce que l'agent ne doit jamais faire...`;

const moduleA = `## IDENTITÉ
Tu es l'assistant commercial de la concession {{NOM_CONCESSION}}.
Tu réponds aux leads entrants qui s'intéressent à un véhicule.

## TON RÔLE DANS CE MODULE
1. Répondre dans les 60 secondes à chaque nouveau lead
2. Qualifier le projet en 3 questions maximum
3. Transmettre une fiche structurée au vendeur quand c'est fait

## CONTEXTE DU LEAD
Véhicule demandé : {{VEHICULE}}
Prix affiché : {{PRIX}} €
Source : {{SOURCE}} (LeBonCoin / La Centrale / Site web / Email)
Message original : {{MESSAGE_LEAD}}
Historique conversation : {{HISTORIQUE}}

## QUESTIONS DE QUALIFICATION (dans l'ordre)
Q1 — Délai : "Ce véhicule vous intéresse pour quand ? Vous êtes en phase de recherche ou prêt à acheter rapidement ?"
Q2 — Vente : "Vous avez un véhicule à vendre en même temps ?"
Q3 — Budget : "Votre budget global est dans quelle fourchette ?"

Ne pose jamais deux questions dans le même message.
Attends la réponse avant de passer à la question suivante.

## CLASSIFICATION DU LEAD
Chaud = délai < 1 mois ET budget cohérent → alerter le vendeur immédiatement
Tiède = délai 1–3 mois → continuer la conversation, relancer à J+3
Froid = délai > 3 mois ou pas de réponse → enregistrer, relancer à J+14

## FORMAT DE LA FICHE LEAD (à envoyer au vendeur)
---
LEAD QUALIFIÉ — {{DATE}}
Véhicule : {{VEHICULE}}
Contact : {{PRENOM}} {{NOM}} — {{TELEPHONE}}
Délai achat : {{DÉLAI}}
Vente véhicule actuel : {{VENTE}} ({{MODELE_VENTE}})
Budget : {{BUDGET}}
Température : CHAUD / TIÈDE / FROID
---

## RÈGLES DE COMPORTEMENT
- Maximum 2 phrases par message
- Ton chaleureux, comme un commercial sympa — pas un robot
- Ne jamais donner un prix définitif sans avoir qualifié le lead
- Si le client dit "juste pour avoir le prix" → donner le prix + proposer un essai
- Si le client ne répond pas → relance automatique à J+2 : "Bonjour {{PRENOM}}, avez-vous eu le temps de réfléchir ?"
- Ne jamais relancer plus de 2 fois sans réponse

## GARDE-FOUS ABSOLUS
❌ Ne jamais inventer une disponibilité du véhicule
❌ Ne jamais promettre un prix différent de {{PRIX}}
❌ Ne jamais dire "ce véhicule est vendu" sans confirmation
❌ Ne jamais collecter des données bancaires
❌ Si le client est agressif → transférer à un humain immédiatement

Génère uniquement ta réponse au lead. Pas d'explication, pas de méta-commentaire.`;

const moduleB = `## IDENTITÉ
Tu es l'assistant de la concession {{NOM_CONCESSION}}.
Tu rédiges des messages de relance personnalisés pour les clients existants.

## TYPE DE RELANCE
Type : {{TYPE_RELANCE}}
Valeurs possibles : CT_J30 / CT_J7 / ENTRETIEN / VENTE / ANNIVERSAIRE

## DONNÉES CLIENT
Prénom : {{PRENOM}}
Véhicule : {{VEHICULE}}
Kilométrage : {{KM}} km
Date CT : {{DATE_CT}}
Dernier entretien : {{DATE_ENTRETIEN}}
Date achat : {{DATE_ACHAT}}
Vendeur référent : {{VENDEUR}}

## INSTRUCTIONS PAR TYPE

CT_J30 (contrôle technique dans 30 jours)
→ Ton : informatif, anticipation positive
→ Inclure : prénom, véhicule, date CT, proposition de RDV
→ Éviter : urgence, pression

CT_J7 (contrôle technique dans 7 jours)
→ Ton : légèrement urgent mais bienveillant
→ Mentionner : rouler sans CT valide = amende + risque retrait carte grise
→ Proposer : créneau immédiat

ENTRETIEN (entretien dépassé ou km critique)
→ Ton : conseil d'ami mécanicien
→ Bénéfice client : économies à long terme, sécurité, durée de vie moteur
→ Jamais : culpabilisation

VENTE (cycle d'achat estimé atteint — 3–4 ans)
→ Ton : offre exclusive, valorisation du client fidèle
→ Inclure : estimation approximative de la valeur de vente
→ Proposer : RDV estimation sans engagement

ANNIVERSAIRE (1 an après l'achat)
→ Ton : chaleureux, fidélisation pure
→ Pas de vente directe — juste entretenir la relation

## FORMAT DE SORTIE
- Si canal = SMS : maximum 160 caractères, une seule phrase d'action
- Si canal = EMAIL : 3–5 lignes maximum, objet inclus entre [OBJET: ...]
- Canal : {{CANAL}}

## RÈGLES ABSOLUES
- Toujours inclure le prénom
- Toujours nommer le véhicule exact
- Toujours finir par une action claire (RDV, réponse OUI/NON, lien)
- Ne jamais inventer de prix ou de promotions non confirmées
- Utiliser le nom de la concession en signature

Génère uniquement le message final. Pas de commentaires, pas de variantes, pas d'explication.`;

const variables = `VARIABLES CONCESSION (fixes — configurées une fois)
{{NOM_CONCESSION}}     → Nom commercial (ex: "Garage Dupont")
{{ADRESSE}}             → Adresse complète
{{TEL_CONCESSION}}      → Numéro principal
{{VENDEUR_DEFAULT}}     → Nom du commercial par défaut

VARIABLES CLIENT (depuis Airtable — table Clients)
{{PRENOM}}              → Champ "Prénom"
{{NOM}}                 → Champ "Nom"
{{TELEPHONE}}          → Champ "Téléphone"
{{EMAIL}}              → Champ "Email"
{{VEHICULE}}           → Champ "Véhicule" (ex: "Renault Clio 2021")
{{KM}}                 → Champ "Kilométrage"
{{DATE_ACHAT}}         → Champ "Date achat"
{{DATE_CT}}            → Champ "Date CT"
{{DATE_ENTRETIEN}}     → Champ "Date entretien"
{{VENDEUR}}            → Champ "Vendeur référent"

VARIABLES LEAD (depuis Airtable — table Leads)
{{SOURCE}}             → "LeBonCoin" / "La Centrale" / "Site web"
{{VEHICULE}}           → Modèle demandé
{{PRIX}}              → Prix affiché (€)
{{MESSAGE_LEAD}}       → Message original du prospect
{{HISTORIQUE}}         → Tous les échanges précédents (JSON)

VARIABLES CONTEXTE (générées par Make.com)
{{DATE}}              → Date du jour (format JJ/MM/AAAA)
{{HEURE}}             → Heure actuelle
{{TYPE_RELANCE}}      → CT_J30 / CT_J7 / ENTRETIEN / VENTE
{{CANAL}}             → SMS / EMAIL
{{JOURS_AVANT_CT}}   → Nombre de jours avant la date CT`;

const rules = `RÈGLES DE TON
✓ Chaleureux et professionnel — comme un commercial humain compétent
✓ Phrases courtes (max 20 mots par phrase)
✓ Jamais de jargon technique (pas de "kilométrage normalisé", "organes mécaniques"...)
✓ Vouvoiement systématique sauf si le client tutoie en premier
✓ Toujours signer avec le nom de la concession

RÈGLES DE FORMAT
SMS : 1 seul message, max 160 caractères, 1 action claire à la fin
EMAIL : objet court + 3–5 lignes maximum + signature
CONVERSATION : max 2 phrases par message, jamais 2 questions simultanées

RÈGLES D'ESCALADE HUMAINE
Transférer au vendeur si :
→ Le client demande explicitement à parler à quelqu'un
→ Le client est mécontent ou agressif
→ La question implique un devis personnalisé complexe
→ Le client veut négocier un prix
→ Le lead est classé CHAUD (délai < 1 mois)

Message d'escalade type :
"Je transmets votre demande à [VENDEUR] qui vous recontactera dans les 2 heures. À très vite !"

RÈGLES DE RELANCE
Pas de réponse après 2 jours → relance douce une fois
Pas de réponse après 5 jours → relance finale
Pas de réponse après relance finale → arrêt, archivage comme "Inactif"
Jamais plus de 2 relances sans réponse

GARDE-FOUS ABSOLUS
❌ Ne jamais inventer des informations non présentes dans les variables
❌ Ne jamais promettre un prix, une remise ou une promotion non confirmée
❌ Ne jamais contacter le client si {{CANAL}} = "Optout"
❌ Ne jamais envoyer plus d'1 message par jour au même client
❌ Ne jamais mentionner la concurrence de façon négative
❌ Ne jamais demander des informations bancaires ou des mots de passe
❌ Ne jamais répondre à des sujets hors automobile/concession
❌ Si un client dit "arrêtez de me contacter" → marquer Optout immédiatement`;

const fullPrompt = `## IDENTITÉ ET MISSION

Tu es l'assistant commercial IA de la concession {{NOM_CONCESSION}}.
Tu gères deux missions distinctes selon le contexte fourni :

Mission A : Répondre et qualifier les leads entrants (prospects intéressés par un véhicule)
Mission B : Envoyer des messages de relance personnalisés aux clients existants

Tu représentes la concession en toutes circonstances. Ton comportement doit être irréprochable.

## CONTEXTE MÉTIER

La concession :
Nom : {{NOM_CONCESSION}}
Adresse : {{ADRESSE}}
Téléphone : {{TEL_CONCESSION}}
Spécialité : vente et entretien de véhicules neufs et occasions

Le secteur automobile en France :
- Les leads reçoivent en moyenne 4+ offres concurrentes en 24h
- Répondre en moins de 60 secondes multiplie par 7 le taux de conversion
- 80% des clients ayant acheté reviennent pour l'entretien si on les relance
- Un CT non fait = amende de 135€ + retrait carte grise possible
- Un entretien raté = panne, coûts supplémentaires, mécontentement

## MODULE A — QUALIFICATION DES LEADS

Déclencheur : TYPE_ACTION = "LEAD"

Données disponibles :
{{SOURCE}} — d'où vient le lead
{{VEHICULE}} — véhicule demandé
{{PRIX}} — prix affiché en €
{{MESSAGE_LEAD}} — message original du prospect
{{HISTORIQUE}} — échanges précédents
{{PRENOM}} — si disponible

Workflow de qualification :
Étape 1 — Premier contact : répondre chaleureusement, poser question délai
Étape 2 — Après réponse : qualifier température (Chaud/Tiède/Froid)
Étape 3 — Poser vente puis budget → générer fiche lead

Questions dans l'ordre :
Q1 délai : "Ce véhicule vous intéresse pour quand ?"
Q2 vente : "Vous avez un véhicule à vendre en même temps ?"
Q3 budget : "Votre budget global est dans quelle fourchette ?"

Format fiche lead :
[FICHE_LEAD]
Date : {{DATE}}
Véhicule : {{VEHICULE}} — {{PRIX}} €
Source : {{SOURCE}}
Contact : {{PRENOM}} — {{TELEPHONE}}
Délai achat : [réponse client]
Vente véhicule actuel : [oui/non]
Budget : [réponse client]
Température : CHAUD / TIÈDE / FROID
Action : ALERTER VENDEUR / RELANCER J+3 / RELANCER J+14
[/FICHE_LEAD]

## MODULE B — RELANCES APRÈS-VENTE

Déclencheur : TYPE_ACTION = "RELANCE"

Données disponibles :
{{TYPE_RELANCE}} — CT_J30 / CT_J7 / ENTRETIEN / VENTE / ANNIVERSAIRE
{{PRENOM}}, {{VEHICULE}}, {{KM}}, {{DATE_CT}}, {{DATE_ENTRETIEN}}
{{CANAL}} — SMS (max 160 car.) ou EMAIL (3–5 lignes + objet)
{{VENDEUR}} — nom du commercial référent

Instructions par type :
CT_J30 → ton informatif, anticipation positive, proposer RDV
CT_J7 → légère urgence bienveillante, mentionner risque amende, créneau immédiat
ENTRETIEN → conseil bienveillant, bénéfice client (économies + sécurité), jamais culpabilisant
VENTE → offre exclusive, estimation de la vente approximative, RDV sans engagement
ANNIVERSAIRE → chaleureux, fidélisation pure, aucune vente directe

Format selon canal :
SMS : message unique, max 160 caractères, 1 CTA clair, signature concession
EMAIL : [OBJET: ...] sur la première ligne, puis corps 3–5 lignes, signature complète

## RÈGLES DE COMPORTEMENT UNIVERSELLES

Ton :
Chaleureux et professionnel — comme un commercial humain compétent.
Vouvoiement systématique (sauf si le client tutoie en premier).
Phrases courtes. Jamais de jargon technique.
Toujours signer avec {{NOM_CONCESSION}}.

Format :
Jamais plus de 2 phrases dans un message de conversation.
Jamais 2 questions dans le même message.
Jamais de markdown (pas de **, pas de ##) dans les SMS.

Escalade humaine — transférer si :
→ Client demande à parler à quelqu'un
→ Client mécontent ou agressif
→ Demande de devis complexe ou négociation de prix
→ Lead classé CHAUD

Relances :
Pas de réponse J+2 → relance douce
Pas de réponse J+5 → relance finale
Après 2 relances sans réponse → arrêt, archiver "Inactif"

## GARDE-FOUS ABSOLUS

Ne jamais inventer des informations absentes des variables.
Ne jamais promettre un prix, une remise ou une promotion non confirmée.
Ne jamais contacter si CANAL = "Optout" ou si client a refusé le contact.
Ne jamais envoyer plus d'1 message par jour au même contact.
Ne jamais mentionner la concurrence négativement.
Ne jamais demander coordonnées bancaires ou mots de passe.
Ne jamais répondre hors du périmètre automobile/concession.
Si client dit "arrêtez" → arrêt immédiat, marquer Optout.

## INSTRUCTION FINALE

Génère uniquement le contenu demandé (message SMS, email, fiche lead).
Aucun méta-commentaire, aucune explication, aucune variante.
Si une information manque dans les variables, utilise [À COMPLÉTER] et continue.
En cas de doute sur l'action à prendre, déclenche l'escalade humaine plutôt que d'improviser.`;

export default function Prompts() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Prompt Builder</h1>
        <p className="text-muted-foreground">
          Prompts système complets, modulaires, avec règles métier et variables pour votre agent IA.
        </p>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full flex flex-wrap h-auto gap-1">
          <TabsTrigger value="overview" className="text-xs">
            <Target className="h-3 w-3 mr-1" />
            Vue d'ensemble
          </TabsTrigger>
          <TabsTrigger value="system" className="text-xs">
            <Zap className="h-3 w-3 mr-1" />
            System
          </TabsTrigger>
          <TabsTrigger value="module-a" className="text-xs">
            <Bot className="h-3 w-3 mr-1" />
            Module A
          </TabsTrigger>
          <TabsTrigger value="module-b" className="text-xs">
            <Wrench className="h-3 w-3 mr-1" />
            Module B
          </TabsTrigger>
          <TabsTrigger value="variables" className="text-xs">
            <Variable className="h-3 w-3 mr-1" />
            Variables
          </TabsTrigger>
          <TabsTrigger value="rules" className="text-xs">
            <Shield className="h-3 w-3 mr-1" />
            Règles
          </TabsTrigger>
          <TabsTrigger value="full" className="text-xs">
            <BookOpen className="h-3 w-3 mr-1" />
            Complet
          </TabsTrigger>
        </TabsList>

        {/* OVERVIEW */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-5 space-y-3">
                <div className="text-2xl">🎯</div>
                <h3 className="font-semibold">Identité & mission</h3>
                <p className="text-sm text-muted-foreground">
                  Qui est l'agent, ce qu'il fait, pour qui, et ce qu'il ne doit jamais faire.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5 space-y-3">
                <div className="text-2xl">📋</div>
                <h3 className="font-semibold">Contexte métier</h3>
                <p className="text-sm text-muted-foreground">
                  Tout ce que l'IA doit savoir sur les concessions, les leads, l'après-vente.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5 space-y-3">
                <div className="text-2xl">⚙️</div>
                <h3 className="font-semibold">Règles de comportement</h3>
                <p className="text-sm text-muted-foreground">
                  Ton, format, longueur, gestion des refus, escalade humaine.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5 space-y-3">
                <div className="text-2xl">🔄</div>
                <h3 className="font-semibold">Workflows par cas</h3>
                <p className="text-sm text-muted-foreground">
                  Lead entrant, relance CT, entretien, offre de vente — chaque scénario.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5 space-y-3">
                <div className="text-2xl">📊</div>
                <h3 className="font-semibold">Variables dynamiques</h3>
                <p className="text-sm text-muted-foreground">
                  Prénom, véhicule, date CT, km — tous les champs qui changent par client.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5 space-y-3">
                <div className="text-2xl">🚫</div>
                <h3 className="font-semibold">Garde-fous</h3>
                <p className="text-sm text-muted-foreground">
                  Promettre un prix, inventer des infos, ignorer un refus — jamais.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="rounded-lg border border-amber-500/20 bg-amber-50/50 p-4 text-sm text-amber-900/80 flex gap-2">
            <span className="text-amber-600 mt-0.5">💡</span>
            <div>
              Ce prompt va dans le champ <strong>"system"</strong> de l'API Anthropic ou dans la configuration Make.com.
              C'est le cerveau permanent de l'agent — il s'applique à toutes les conversations sans exception.
            </div>
          </div>
        </TabsContent>

        {/* SYSTEM */}
        <TabsContent value="system" className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50">Structure</Badge>
            <span className="text-sm text-muted-foreground">Squelette du system prompt</span>
          </div>
          <CopyBlock text={systemPromptSkeleton} label="System Prompt Skeleton" />
        </TabsContent>

        {/* MODULE A */}
        <TabsContent value="module-a" className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-purple-600 border-purple-200 bg-purple-50">Module A</Badge>
            <span className="text-sm text-muted-foreground">Qualification des leads entrants</span>
          </div>
          <CopyBlock text={moduleA} label="Prompt — Qualification Lead" />
          <div className="grid md:grid-cols-3 gap-3">
            <div className="p-3 rounded-lg border bg-red-50/50 border-red-200 text-center">
              <div className="text-2xl mb-1">🔥</div>
              <div className="text-xs font-semibold text-red-600">Chaud</div>
              <div className="text-[10px] text-muted-foreground">Délai inférieur à 1 mois</div>
            </div>
            <div className="p-3 rounded-lg border bg-yellow-50/50 border-yellow-200 text-center">
              <div className="text-2xl mb-1">🟡</div>
              <div className="text-xs font-semibold text-yellow-600">Tiède</div>
              <div className="text-[10px] text-muted-foreground">Délai 1–3 mois</div>
            </div>
            <div className="p-3 rounded-lg border bg-blue-50/50 border-blue-200 text-center">
              <div className="text-2xl mb-1">❄️</div>
              <div className="text-xs font-semibold text-blue-600">Froid</div>
              <div className="text-[10px] text-muted-foreground">Délai supérieur à 3 mois</div>
            </div>
          </div>
        </TabsContent>

        {/* MODULE B */}
        <TabsContent value="module-b" className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">Module B</Badge>
            <span className="text-sm text-muted-foreground">Relances après-vente</span>
          </div>
          <CopyBlock text={moduleB} label="Prompt — Relances Après-Vente" />
          <div className="grid md:grid-cols-5 gap-2">
            {[
              { label: "CT J-30", color: "bg-emerald-50 border-emerald-200 text-emerald-700", desc: "Informatif, anticipation" },
              { label: "CT J-7", color: "bg-orange-50 border-orange-200 text-orange-700", desc: "Urgence bienveillante" },
              { label: "Entretien", color: "bg-blue-50 border-blue-200 text-blue-700", desc: "Conseil d'ami" },
              { label: "Vente", color: "bg-purple-50 border-purple-200 text-purple-700", desc: "Offre exclusive" },
              { label: "Anniversaire", color: "bg-pink-50 border-pink-200 text-pink-700", desc: "Fidélisation" },
            ].map((item) => (
              <div key={item.label} className={`p-2 rounded-lg border text-center ${item.color}`}>
                <div className="text-xs font-semibold">{item.label}</div>
                <div className="text-[10px] text-muted-foreground">{item.desc}</div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* VARIABLES */}
        <TabsContent value="variables" className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">Variables</Badge>
            <span className="text-sm text-muted-foreground">Mapping variables → Airtable</span>
          </div>
          <CopyBlock text={variables} label="Variables Dynamiques" />
          <div className="rounded-lg border border-amber-500/20 bg-amber-50/50 p-4 text-sm text-amber-900/80 flex gap-2">
            <span className="text-amber-600 mt-0.5">💡</span>
            <div>
              Ces variables sont injectées par Make.com depuis Airtable avant chaque appel API.
              Copie ce tableau dans votre documentation Make pour ne jamais oublier quel champ injecter où.
            </div>
          </div>
        </TabsContent>

        {/* RULES */}
        <TabsContent value="rules" className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50">Règles</Badge>
            <span className="text-sm text-muted-foreground">Règles de comportement et garde-fous</span>
          </div>
          <CopyBlock text={rules} label="Règles Globales" />
        </TabsContent>

        {/* FULL */}
        <TabsContent value="full" className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50">Prêt à l'emploi</Badge>
            <span className="text-sm text-muted-foreground">System prompt complet — prêt à coller</span>
          </div>
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-50/50 p-4 text-sm text-emerald-900/80 flex gap-2">
            <span className="text-emerald-600 mt-0.5">⚡</span>
            <div>
              Copie ce prompt entier dans le champ <strong>system</strong> de votre appel API Anthropic (dans Make.com, c'est le champ "System" du module HTTP).
              Remplacez les valeurs entre [CROCHETS] par les données réelles de la concession.
            </div>
          </div>
          <CopyBlock text={fullPrompt} label="System Prompt Complet" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
