// Recherche de candidats sur Job-Room (travail.swiss), la plateforme publique de
// l'assurance-chômage. Format relevé le 05/11/2026 sur la page publique
// https://www.job-room.ch/candidate-search : la recherche fonctionne sans compte.
//
// Règles : recherche lancée par une personne, à la demande ; rien n'est enregistré ;
// on ne garde que des champs anonymes et le lien vers la fiche officielle.

export const URL_RECHERCHE = "https://www.job-room.ch/candidateservice/api/_search/candidates";
export const URL_FICHE = "https://www.job-room.ch/candidate-search/";

export type CodeMetier = {
  id: string;
  type: "AVAM" | "CHISCO5";
  value: string;
  mapping?: { type: "BFS"; value: string };
  classifier?: string;
};

export type Metier = {
  cle: string;
  libelle: { fr: string; en: string };
  code: CodeMetier;
  /** Métier du ménage lui-même, ou métier proche où l'on recrute aussi. */
  coeur: boolean;
};

export const METIERS: Metier[] = [
  {
    cle: "menage-prive",
    libelle: { fr: "Employé·e de nettoyage (ménage privé)", en: "Cleaner (private households)" },
    code: { id: "AVAM-102324-fr-default", type: "AVAM", value: "102324", mapping: { type: "BFS", value: "51103772" } },
    coeur: true,
  },
  {
    cle: "nettoyage",
    libelle: { fr: "Employé·e de nettoyage", en: "Cleaner" },
    code: { id: "AVAM-102221-fr-default", type: "AVAM", value: "102221", mapping: { type: "BFS", value: "41103017" } },
    coeur: true,
  },
  {
    cle: "intendance",
    libelle: { fr: "Auxiliaire d'intendance (ménage privé)", en: "Housekeeping assistant (private households)" },
    code: { id: "AVAM-101883-fr-default", type: "AVAM", value: "101883", mapping: { type: "BFS", value: "51103042" } },
    coeur: false,
  },
  {
    cle: "chambre",
    libelle: { fr: "Femme / garçon de chambre", en: "Room attendant" },
    code: { id: "CHISCO5-91120-fr-default", type: "CHISCO5", value: "91120", classifier: "default" },
    coeur: false,
  },
  {
    cle: "concierge",
    libelle: { fr: "Concierge", en: "Caretaker" },
    code: { id: "AVAM-101822-fr-default", type: "AVAM", value: "101822", mapping: { type: "BFS", value: "51101365" } },
    coeur: false,
  },
];

export const CANTONS_ROMANDS = ["VD", "GE", "VS", "FR", "NE", "JU"] as const;
export type Canton = (typeof CANTONS_ROMANDS)[number];

export type Disponibilite = "IMMEDIATE" | "BY_ARRANGEMENT" | "TOUTES";
export type Experience = "TOUTE" | "MORE_THAN_1_YEAR" | "MORE_THAN_3_YEARS";
export type Langue = "fr" | "en";

/** Les paramètres que la personne choisit avant de lancer la recherche. */
export type Criteres = {
  canton: Canton;
  disponibilite: Disponibilite;
  tauxMin: number;
  tauxMax: number;
  /** Langues parlées exigées : toutes celles cochées. */
  langues: Langue[];
  experience: Experience;
};

/** On ne cherche que dans les métiers du nettoyage. */
export const CODES_RECHERCHE = METIERS.filter((m) => m.coeur).map((m) => m.code);

export function corpsRecherche(c: Criteres) {
  const tauxMin = Math.max(10, Math.min(100, Math.round(c.tauxMin / 10) * 10));
  const tauxMax = Math.max(tauxMin, Math.min(100, Math.round(c.tauxMax / 10) * 10));
  return {
    occupationCodes: CODES_RECHERCHE,
    skills: [],
    cantonCode: null,
    regionCode: null,
    degree: null,
    graduation: null,
    experience: c.experience === "TOUTE" ? null : c.experience,
    residence: [c.canton],
    availability: c.disponibilite === "TOUTES" ? null : c.disponibilite,
    workLoad: { min: tauxMin, max: tauxMax },
    drivingLicenceCategory: null,
    workForm: null,
    languageSkills: c.langues.map((code) => ({ code })),
    radiusSearchRequest: null,
  };
}

/** Profil tel qu'on l'affiche : seulement des champs anonymes. Le genre n'est jamais repris. */
export type ProfilAnonyme = {
  id: string;
  lien: string;
  metierCode: number | null;
  metierCodeType: "AVAM" | "CHISCO5" | null;
  experience: string | null;
  canton: string | null;
  cantonsSouhaites: string[];
  disponibilite: string | null;
  taux: number | null;
  langues: { code: string; oral: string }[];
  /** Catégories de permis de conduire (pas le titre de séjour). */
  permisDeConduire: string[];
};

type ExperienceBrute = { occupation?: { avamCode?: number; chIsco5Code?: number }; experience?: string; lastJob?: boolean; wanted?: boolean };
type ProfilBrut = {
  candidateProfile?: {
    id?: string;
    availability?: string;
    residenceCantonCode?: string;
    workLoad?: number;
    preferredWorkCantons?: string[];
    jobExperiences?: ExperienceBrute[];
    languages?: { code?: string; spokenLevel?: string }[];
    drivingCategories?: string[];
  };
};

export function anonymiser(brut: ProfilBrut): ProfilAnonyme | null {
  const p = brut.candidateProfile;
  if (!p?.id) return null;
  const exp = p.jobExperiences ?? [];
  // On montre d'abord l'expérience dans le ménage, s'il y en a une ; sinon le dernier emploi.
  const codesMenage = METIERS.map((m) => Number(m.code.value));
  const principale =
    exp.find((e) => codesMenage.includes(e.occupation?.avamCode ?? -1) || codesMenage.includes(e.occupation?.chIsco5Code ?? -1)) ??
    exp.find((e) => e.lastJob) ?? exp.find((e) => e.wanted) ?? exp[0];
  const avam = principale?.occupation?.avamCode ?? null;
  const isco = principale?.occupation?.chIsco5Code ?? null;
  return {
    id: p.id,
    lien: URL_FICHE + encodeURIComponent(p.id),
    metierCode: avam ?? isco,
    metierCodeType: avam ? "AVAM" : isco ? "CHISCO5" : null,
    experience: principale?.experience ?? null,
    canton: p.residenceCantonCode ?? null,
    cantonsSouhaites: p.preferredWorkCantons ?? [],
    disponibilite: p.availability ?? null,
    taux: typeof p.workLoad === "number" ? p.workLoad : null,
    langues: (p.languages ?? []).filter((l) => l.code).map((l) => ({ code: l.code!, oral: l.spokenLevel ?? "" })),
    permisDeConduire: p.drivingCategories ?? [],
  };
}

/** Classement simple et explicable, utilisé quand l'IA n'est pas disponible et comme base pour elle. */
export function scoreProfil(p: ProfilAnonyme, c: Criteres) {
  let score = 0;
  const raisons: string[] = [];
  const coeur = METIERS.filter((m) => m.coeur).map((m) => Number(m.code.value));
  if (p.metierCode !== null && coeur.includes(p.metierCode)) {
    score += 3;
    raisons.push("metier");
  }
  if (p.disponibilite === "IMMEDIATE") {
    score += 2;
    raisons.push("dispo");
  }
  if (p.experience === "MORE_THAN_3_YEARS") {
    score += 2;
    raisons.push("experience3");
  } else if (p.experience === "MORE_THAN_1_YEAR") {
    score += 1;
    raisons.push("experience1");
  }
  if (p.cantonsSouhaites.includes(c.canton) || p.canton === c.canton) {
    score += 1;
    raisons.push("canton");
  }
  if (c.langues.length ? c.langues.every((code) => p.langues.some((l) => l.code === code)) : p.langues.some((l) => l.code === "fr")) {
    score += 1;
    raisons.push("francais");
  }
  if (p.taux !== null && p.taux >= 30 && p.taux <= 80) {
    score += 1;
    raisons.push("tempsPartiel");
  }
  return { score, raisons };
}

export async function rechercher(c: Criteres, taille = 20, signal?: AbortSignal) {
  const reponse = await fetch(`${URL_RECHERCHE}?page=0&size=${taille}&_ng=ZnI=`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(corpsRecherche(c)),
    signal,
    cache: "no-store",
  });
  if (!reponse.ok) throw new Error(`Job-Room a répondu ${reponse.status}`);
  const total = Number(reponse.headers.get("x-total-count") ?? "0");
  const donnees = (await reponse.json()) as ProfilBrut[] | { content?: ProfilBrut[] };
  const liste = Array.isArray(donnees) ? donnees : donnees.content ?? [];
  const profils = liste.map(anonymiser).filter((p): p is ProfilAnonyme => p !== null);
  return { total, profils };
}

/** Totaux par canton, en Suisse romande (relevé du 05/11/2026), affichés si Job-Room ne répond pas. */
export const RELEVE_05_11_2026 = {
  date: "2026-11-05",
  parCanton: {
    VD: { total: 1740, immediat: 927 },
    GE: { total: 1506, immediat: 883 },
    VS: { total: 805, immediat: 460 },
    FR: { total: 661, immediat: 300 },
    NE: { total: 409, immediat: 223 },
  } as Record<string, { total: number; immediat: number }>,
  romandie: { total: 5121, immediat: 2793 },
};
