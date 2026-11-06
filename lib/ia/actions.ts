import "server-only";

// Les actions d'IA du prototype. Chacune : une consigne, un schéma de réponse, un repli sans IA.

import { z } from "zod";
import { appelStructure, appelTexte } from "./serveur";
import { repliAlerte, repliAssistant, repliCandidature, repliClassement, repliMessageOrp, repliReformuler } from "./repli";
import type { Criteres, ProfilAnonyme } from "../jobroom";
import type { Candidature } from "../donnees/recrutement";
import type { FicheLogement } from "../donnees";
import type { Sens } from "../regles/notation";

type L = "fr" | "en";
const langueEcrite = (l: L) => (l === "fr" ? "Réponds en français." : "Answer in English.");

/** Schéma JSON pour les sorties structurées : objets fermés, tous les champs requis. */
function schemaPour(s: z.ZodType): Record<string, unknown> {
  const brut = z.toJSONSchema(s) as Record<string, unknown>;
  const fermer = (n: unknown): unknown => {
    if (Array.isArray(n)) return n.map(fermer);
    if (n && typeof n === "object") {
      const o = Object.fromEntries(Object.entries(n).filter(([k]) => k !== "$schema").map(([k, v]) => [k, fermer(v)]));
      if (o.type === "object" && o.properties) {
        o.additionalProperties = false;
        o.required = Object.keys(o.properties as object);
      }
      return o;
    }
    return n;
  };
  return fermer(brut) as Record<string, unknown>;
}

// 2. Classement des profils trouvés
const SchemaClassement = z.object({
  selection: z.array(z.object({ id: z.string(), raison: z.string() })).max(6),
  synthese: z.string(),
});

export function classement(profils: ProfilAnonyme[], c: Criteres, besoin: string, langue: L) {
  const ids = new Set(profils.map((p) => p.id));
  return appelStructure({
    consigne: `Classe des profils anonymes de demandeurs d'emploi pour un poste de ménage chez des particuliers.
Garde au plus 5 profils, du plus pertinent au moins pertinent, avec une raison courte (moins de 15 mots) fondée uniquement sur les champs fournis.
N'utilise jamais le genre, l'âge supposé ou l'origine : ces informations ne te sont pas données et ne doivent pas être devinées.
« permisDeConduire » désigne le permis de conduire, pas l'autorisation de travail ou de séjour, qui n'est pas connue à ce stade.
La synthèse dit en une phrase ce qui ressort de la liste. ${langueEcrite(langue)}`,
    contenu: JSON.stringify({ besoin, criteres: c, profils }),
    schemaJson: schemaPour(SchemaClassement),
    valider: SchemaClassement.refine((r) => r.selection.every((s) => ids.has(s.id)), "identifiant inconnu"),
    repli: () => repliClassement(profils, c, langue),
  });
}

// 3. Message à la conseillère ou au conseiller ORP (toujours en français : ORP romands)
const SchemaMessage = z.object({ objet: z.string(), corps: z.string() });

export function messageOrp(p: { commune: string; creneau: string; jours: string; liens: string[]; taux: string }) {
  return appelStructure({
    consigne: `Rédige un courriel à une conseillère ou un conseiller ORP (office régional de placement) pour proposer un emploi aux demandeurs d'emploi dont on donne les liens de fiche travail.swiss.
Ton professionnel et chaleureux, 120 à 180 mots, en français, vouvoiement. Pas de prix, pas de salaire chiffré, pas de promesse.
Le poste : ménage chez des particuliers, temps partiel ; reprends le créneau, le nombre de jours par semaine et le taux fournis ; déclaré et assuré, produits fournis. Signature : « Le service recrutement de MénageSimple ».
Reprends les liens tels quels, un par ligne.`,
    contenu: JSON.stringify(p),
    schemaJson: schemaPour(SchemaMessage),
    valider: SchemaMessage,
    repli: () => repliMessageOrp(p),
  });
}

// 4. Présélection d'une candidature
const SchemaCandidature = z.object({
  resume: z.string(),
  pointsForts: z.array(z.string()).max(5),
  aVerifier: z.array(z.string()).max(5),
  questions: z.array(z.string()).min(1).max(4),
  suggestion: z.enum(["appeler", "a-voir"]),
});

export function candidature(c: Candidature, zonesEnManque: string[], langue: L) {
  return appelStructure({
    consigne: `Prépare la présélection d'une candidature pour un poste d'agent de ménage chez des particuliers.
Résumé en une phrase ; points forts et points à vérifier fondés uniquement sur la candidature ; 2 à 4 questions d'entretien utiles.
« suggestion » vaut « appeler » si rien de bloquant n'est à vérifier, sinon « a-voir ». Ce n'est qu'une suggestion : l'équipe décide.
N'utilise jamais le prénom, l'origine, les langues maternelles ou l'âge supposé comme critère négatif. L'autorisation de travail se vérifie, elle ne se devine pas. ${langueEcrite(langue)}`,
    contenu: JSON.stringify({ candidature: c, zonesEnManque }),
    schemaJson: schemaPour(SchemaCandidature),
    valider: SchemaCandidature,
    repli: () => repliCandidature(c, zonesEnManque, langue),
  });
}

// 5. Reformulation d'une note vocale en consignes pour la fiche du logement
const SchemaReformulation = z.object({
  routine: z.array(z.string()).max(6),
  preferences: z.array(z.string()).max(6),
  interdits: z.array(z.string()).max(6),
  acces: z.array(z.string()).max(4),
  aSignaler: z.array(z.string()).max(4),
  resume: z.string(),
});

export function reformuler(transcription: string, fiche: FicheLogement | null, langue: L) {
  return appelStructure({
    consigne: `Un agent de ménage a dicté une note orale en sortant d'un logement. Transforme-la en consignes claires pour la fiche du logement, que lira un remplaçant.
Une consigne par ligne, à l'infinitif ou en phrase courte, sans « euh » ni hésitation. Garde la raison quand elle est dite (ex. « pierre naturelle », « enfant asthmatique »).
Classe : routine (ordre des tâches), preferences, interdits (ce qu'il ne faut pas faire), acces (clés, animaux, portes), aSignaler (matériel manquant, panne, casse : pour le bureau, pas pour la fiche).
Quand l'agent se corrige, garde sa dernière version. Ne répète pas une consigne déjà présente dans la fiche actuelle. Résumé : une phrase. ${langueEcrite(langue)}`,
    contenu: JSON.stringify({ transcription, ficheActuelle: fiche }),
    schemaJson: schemaPour(SchemaReformulation),
    valider: SchemaReformulation,
    effort: "medium",
    repli: () => repliReformuler(transcription, langue),
  });
}

// 6. Assistant ménage pour les agents
export function assistant(question: string, historique: { role: "user" | "assistant"; content: string }[], fiche: FicheLogement | null, langue: L) {
  return appelTexte({
    consigne: `Tu es l'assistant ménage des agents de MénageSimple, sur leur téléphone, souvent pendant un passage.
Réponds uniquement aux questions de ménage, d'entretien des matériaux et de sécurité des produits. Pour tout le reste (salaire, litige, accident, horaire), renvoie poliment vers le bureau.
Réponse en étapes numérotées, 3 à 5 étapes, phrases courtes, puis une ligne « Attention : » avec la précaution principale.
Règles de sécurité non négociables : ne jamais conseiller de mélanger deux produits ; jamais d'acide (vinaigre, détartrant) sur la pierre naturelle ; tester sur une partie cachée en cas de doute ; aérer avec un produit fort.
Si la fiche du logement contient un interdit lié à la question, rappelle-le. Sans mise en forme Markdown (pas d'astérisques ni de titres). ${langueEcrite(langue)}
Fiche du logement : ${fiche ? JSON.stringify({ interdits: fiche.interdits, preferences: fiche.preferences }) : "aucune"}`,
    messages: [...historique.slice(-6), { role: "user", content: question }],
    repli: () => repliAssistant(question, langue, fiche?.interdits ?? []).reponse,
  });
}

// 7. Messages d'alerte après une mauvaise note
const SchemaAlerte = z.object({ messageBureau: z.string(), messagePersonne: z.string() });

export function alerte(p: { sens: Sens; etoiles: number; commentaire: string; cibleNom: string; auteurNom: string }, langue: L) {
  return appelStructure({
    consigne: `Une note de 1 ou 2 étoiles vient d'être donnée. Rédige deux messages courts.
messageBureau : pour le service qualité, factuel (qui, quelle note, commentaire, action proposée : rappeler dans les 24 heures).
messagePersonne : pour la personne notée (agent ou client), bienveillant, au vouvoiement, sans citer la note ni le nom de l'auteur, qui annonce un appel du bureau. 2 phrases au plus. ${langueEcrite(langue)}`,
    contenu: JSON.stringify(p),
    schemaJson: schemaPour(SchemaAlerte),
    valider: SchemaAlerte,
    repli: () => repliAlerte(p, langue),
  });
}
