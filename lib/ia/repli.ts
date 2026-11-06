// Réponses sans IA : règles simples, utilisées quand aucune clé n'est configurée
// ou quand l'appel échoue. Elles gardent la démonstration et les tests reproductibles.

import { type Criteres, type ProfilAnonyme, scoreProfil } from "../jobroom";
import { chercherConseil } from "../donnees/formation";
import type { Candidature } from "../donnees/recrutement";
import type { Sens } from "../regles/notation";

type L = "fr" | "en";
const tr = (l: L, fr: string, en: string) => (l === "fr" ? fr : en);

const LIBELLES_RAISONS: Record<string, [string, string]> = {
  metier: ["métier du ménage", "cleaning occupation"],
  dispo: ["disponible tout de suite", "available now"],
  experience3: ["plus de 3 ans d'expérience", "3+ years of experience"],
  experience1: ["plus d'un an d'expérience", "1+ year of experience"],
  canton: ["cherche dans le canton", "looking in the canton"],
  francais: ["parle français", "speaks French"],
  tempsPartiel: ["temps partiel compatible", "part-time fit"],
};

export function repliClassement(profils: ProfilAnonyme[], criteres: Criteres, langue: L, nombre = 5) {
  const classes = profils
    .map((p) => ({ p, ...scoreProfil(p, criteres) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, nombre);
  return {
    selection: classes.map((c) => ({
      id: c.p.id,
      raison: c.raisons.map((r) => tr(langue, ...LIBELLES_RAISONS[r])).join(", "),
    })),
    synthese: tr(
      langue,
      `${classes.length} profils retenus sur ${profils.length} lus, classés par métier, disponibilité, expérience et langue.`,
      `${classes.length} profiles kept out of ${profils.length} read, ranked by occupation, availability, experience and language.`,
    ),
  };
}

export function repliMessageOrp(p: { commune: string; creneau: string; jours: string; liens: string[]; taux: string }) {
  const liste = p.liens.map((l) => `- ${l}`).join("\n");
  return {
    objet: `Offre de travail : ménage chez des particuliers, région de ${p.commune}`,
    corps: `Bonjour,

MénageSimple, agence de placement de personnel de ménage en Suisse romande, recrute dans la région de ${p.commune}, en priorité pour ce créneau : ${p.creneau}, ${p.jours}.

Les profils ci-dessous, publiés sur travail.swiss, semblent correspondre :
${liste}

Le poste : ménage chez des particuliers, à temps partiel (${p.taux}), horaires choisis par la personne, déclaré et assuré, produits fournis.

Pourriez-vous transmettre notre proposition aux personnes concernées, si elle les intéresse ? Elles peuvent nous répondre directement ou passer par vous.

Merci d'avance, et belle journée.

Le service recrutement de MénageSimple`,
  };
}

export function repliCandidature(c: Candidature, zonesEnManque: string[], langue: L) {
  const pointsForts: string[] = [];
  const aVerifier: string[] = [];
  const questions: string[] = [];
  const zonesUtiles = c.zones.filter((z) => zonesEnManque.includes(z));
  if (zonesUtiles.length) pointsForts.push(tr(langue, `Disponible dans une zone en manque : ${zonesUtiles.join(", ")}`, `Available in a short-staffed area: ${zonesUtiles.join(", ")}`));
  if (/\d+\s*an/.test(c.experience)) pointsForts.push(tr(langue, `Expérience : ${c.experience}`, `Experience: ${c.experience}`));
  if (c.parrainId) pointsForts.push(tr(langue, "Recommandé par un agent en poste", "Referred by a current cleaner"));
  if (c.langues.includes("fr")) pointsForts.push(tr(langue, "Parle français", "Speaks French"));
  if (c.permis === "aucun") aVerifier.push(tr(langue, "Pas d'autorisation de travail indiquée : à vérifier avant tout entretien", "No work permit stated: check before any interview"));
  if (c.permis === "G") aVerifier.push(tr(langue, "Permis frontalier : vérifier les zones et les trajets", "Cross-border permit: check areas and commute"));
  if (!c.langues.includes("fr")) aVerifier.push(tr(langue, "Français non indiqué : à évaluer au téléphone", "French not stated: assess on the phone"));
  if (c.references === 0) aVerifier.push(tr(langue, "Aucune référence : en demander une", "No references: ask for one"));
  questions.push(tr(langue, "Quels créneaux pouvez-vous garantir chaque semaine ?", "Which time slots can you guarantee each week?"));
  questions.push(tr(langue, "Comment vous rendez-vous chez les clients (transports, voiture) ?", "How do you get to clients (public transport, car)?"));
  if (!/\d+\s*an/.test(c.experience)) questions.push(tr(langue, "Racontez-nous un ménage complet que vous avez fait : par où commencez-vous ?", "Walk us through a full clean you did: where do you start?"));
  return {
    resume: tr(
      langue,
      `${c.prenom} ${c.initialeNom}, ${c.commune}, cherche ${c.tauxSouhaite} % (${c.horaires}).`,
      `${c.prenom} ${c.initialeNom}, ${c.commune}, looking for ${c.tauxSouhaite}% (${c.horaires}).`,
    ),
    pointsForts,
    aVerifier,
    questions,
    suggestion: (aVerifier.length === 0 || (aVerifier.length === 1 && c.references === 0) ? "appeler" : "a-voir") as "appeler" | "a-voir",
  };
}

export type Reformulation = {
  routine: string[];
  preferences: string[];
  interdits: string[];
  acces: string[];
  aSignaler: string[];
  resume: string;
};

/** Vrai si le texte contient l'un des mots ou expressions, en mots entiers (lettres accentuées comprises). */
export function contient(texte: string, mots: string[]) {
  const echapper = (m: string) => m.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?<![\\p{L}])(?:${mots.map(echapper).join("|")})(?![\\p{L}])`, "iu").test(texte);
}

/** Découpe une note orale en consignes, par mots-clés. Moins fin que l'IA, mais honnête. */
export function repliReformuler(transcription: string, langue: L): Reformulation {
  const majuscule = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  // Quand l'agent se corrige (« à la fin, euh non, avant dix heures »), on garde la dernière version.
  const corrigee = transcription.replace(/[^.,]*,?\s*euh non,?\s*/gi, (m) => (/\b(non)\b/i.test(m) ? "" : m));
  const phrases = corrigee
    .split(/[.!?]|,\s*(?=(?:et |puis |ah )?(?:il faut|elle|il |le |la |les |pour |faut |donc ))/i)
    .map((s) =>
      s
        .replace(/(?<![\p{L}])(euh|alors|bon|ben|en fait|sinon)(?![\p{L}]),?/giu, "")
        .replace(/^\s*(ah|et puis|et|puis|donc|mais|bref)\b,?\s*/i, "")
        .replace(/^\s*(ah|et puis|et|puis|donc|mais|bref)\b,?\s*/i, "")
        .replace(/\b(la dame|le monsieur|madame|monsieur)\s+(m'a\s+(re)?dit|dit|veut|demande)\s+(qu'|que\s+)?/i, "")
        .replace(/\bil faut vraiment\b/i, "il faut")
        .replace(/\s+/g, " ")
        .trim(),
    )
    .filter((s) => s.length > 8);
  const r: Reformulation = { routine: [], preferences: [], interdits: [], acces: [], aSignaler: [], resume: "" };
  for (const brut of phrases) {
    const s = majuscule(brut.replace(/^il faut /i, "").replace(/^faut /i, ""));
    const t = brut.toLowerCase();
    if (contient(t, ["pas de", "jamais", "ne pas", "touche pas", "touche rien", "faut pas", "ni produit", "rien sur", "interdit", "pas mettre"])) r.interdits.push(s);
    else if (contient(t, ["clé", "clés", "code", "chat", "chien", "porte", "portes", "sonner", "interphone", "parking", "balcon"])) r.acces.push(s);
    else if (contient(t, ["commencer", "d'abord", "en premier", "à la fin", "ensuite", "avant", "après"])) r.routine.push(s);
    else if (contient(t, ["marchait plus", "en panne", "cassé", "plein", "racheter", "manque", "plus de"])) r.aSignaler.push(s);
    else if (contient(t, ["préfère", "veut", "aime", "demande", "sans parfum", "repasse", "plier", "cintre", "cintres", "toujours", "chiffon", "humide", "essoré"])) r.preferences.push(s);
  }
  r.resume = tr(
    langue,
    `${r.interdits.length} interdit(s), ${r.preferences.length} préférence(s), ${r.routine.length} étape(s) de routine, ${r.aSignaler.length} point(s) à signaler. Découpage automatique par mots-clés : relire avant de valider.`,
    `${r.interdits.length} don't(s), ${r.preferences.length} preference(s), ${r.routine.length} routine step(s), ${r.aSignaler.length} issue(s) to report. Keyword-based split: review before approving.`,
  );
  return r;
}

export function repliAssistant(question: string, langue: L, interdits: string[] = []) {
  const conseil = chercherConseil(question);
  const rappel = interdits.length
    ? tr(langue, `\n\nChez ce client : ${interdits.join(" ; ")}.`, `\n\nAt this client's home: ${interdits.join("; ")}.`)
    : "";
  if (!conseil) {
    return {
      reponse:
        tr(
          langue,
          "Je n'ai pas de fiche sur ce sujet. Décrivez la surface (matière, couleur) et la tache, ou demandez au bureau. Dans le doute : tester sur une petite partie cachée, et ne jamais mélanger deux produits.",
          "I don't have a sheet on this. Describe the surface (material, colour) and the stain, or ask the office. When in doubt: test on a small hidden spot, and never mix two products.",
        ) + rappel,
      source: "fiche" as const,
    };
  }
  const etapes = conseil.etapes.map((e, i) => `${i + 1}. ${e[langue]}`).join("\n");
  return {
    reponse: `${conseil.titre[langue]}\n${etapes}\n\n${tr(langue, "Attention", "Caution")} : ${conseil.precaution[langue]}${rappel}`,
    source: "fiche" as const,
  };
}

export function repliAlerte(p: { sens: Sens; etoiles: number; commentaire: string; cibleNom: string; auteurNom: string }, langue: L) {
  const surAgent = p.sens === "client-note-agent";
  return {
    messageBureau: tr(
      langue,
      `Note de ${p.etoiles}/5 ${surAgent ? `pour l'agent ${p.cibleNom}, donnée par ${p.auteurNom}` : `pour le client ${p.cibleNom}, donnée par l'agent ${p.auteurNom}`}. Commentaire : « ${p.commentaire || "aucun"} ». À rappeler dans les 24 heures.`,
      `${p.etoiles}/5 rating ${surAgent ? `for cleaner ${p.cibleNom}, from ${p.auteurNom}` : `for client ${p.cibleNom}, from cleaner ${p.auteurNom}`}. Comment: "${p.commentaire || "none"}". Call back within 24 hours.`,
    ),
    messagePersonne: surAgent
      ? tr(
          langue,
          `Bonjour ${p.cibleNom.split(" ")[0]}, un client nous a fait un retour sur votre dernier passage. Rien de grave : l'équipe de coordination vous appelle aujourd'hui pour en parler et voir ce qui peut vous aider.`,
          `Hello ${p.cibleNom.split(" ")[0]}, a client gave us feedback on your last visit. Nothing serious: your coordinator will call you today to talk it through and see what could help.`,
        )
      : tr(
          langue,
          `Bonjour, notre agent a rencontré une difficulté lors du dernier passage chez vous. Pour que tout se passe bien la prochaine fois, notre équipe vous appelle aujourd'hui.`,
          `Hello, our cleaner ran into a difficulty during the last visit to your home. To make sure next time goes smoothly, our team will call you today.`,
        ),
  };
}
