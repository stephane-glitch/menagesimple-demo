// Règles du parrainage entre agents.

/** Prime versée en deux fois : à la retenue, puis après les 30 premières heures. */
export const PRIME_CHF = 50;
/** Prime augmentée pour un filleul recruté dans une zone en manque d'agents. */
export const PRIME_AUGMENTEE_CHF = 75;
export const SEUIL_HEURES = 30;

export type EtapeFilleul = "invite" | "candidature" | "retenu" | "refuse" | "actif";

export type Filleul = {
  id: string;
  parrainId: string;
  etape: EtapeFilleul;
  heuresTravaillees: number;
  /** Zone en manque au moment de l'invitation : prime augmentée. */
  zoneEnManque: boolean;
};

export type Primes = { retenue: number; trenteHeures: number; total: number; aVenir: number };

/**
 * Primes dues au parrain pour un filleul : 50 CHF quand il est retenu, 50 CHF de plus
 * après 30 heures travaillées ; 75 CHF et 75 CHF dans une zone en manque.
 */
export function primesDues(f: Filleul): Primes {
  const montant = f.zoneEnManque ? PRIME_AUGMENTEE_CHF : PRIME_CHF;
  const retenu = f.etape === "retenu" || f.etape === "actif";
  const retenue = retenu ? montant : 0;
  const trenteHeures = retenu && f.heuresTravaillees >= SEUIL_HEURES ? montant : 0;
  const maximum = f.etape === "refuse" ? 0 : montant * 2;
  return { retenue, trenteHeures, total: retenue + trenteHeures, aVenir: maximum - retenue - trenteHeures };
}

/** Un même candidat ne peut pas être parrainé deux fois. */
export function dejaParraine(filleuls: { email: string }[], email: string) {
  const cle = email.trim().toLowerCase();
  return filleuls.some((f) => f.email.trim().toLowerCase() === cle);
}

/** Code de parrainage lisible, stable pour un agent donné. */
export function codeParrainage(prenom: string, idAgent: string) {
  const base = prenom
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z]/g, "")
    .toUpperCase()
    .slice(0, 6);
  const suffixe = idAgent.replace(/\D/g, "").padStart(3, "0").slice(-3);
  return `${base}-${suffixe}`;
}
