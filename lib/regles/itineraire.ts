// Ordre des passages d'une journée qui réduit les trajets, en respectant les
// créneaux imposés par les clients.

import { trajetEstime, type Point } from "./geo";

export type Etape = Point & {
  id: string;
  /** Créneau imposé par le client : l'étape doit commencer dans cette fenêtre (minutes depuis minuit). */
  debutMin?: number;
  debutMax?: number;
  dureeMin: number;
};

export type Tournee = {
  ordre: string[];
  km: number;
  minutesTrajet: number;
  /** Heure de début de chaque étape, en minutes depuis minuit. */
  debuts: number[];
  respecteCreneaux: boolean;
};

function evaluer(depart: Point, etapes: Etape[], heureDepart: number): Tournee {
  let position: Point = depart;
  let heure = heureDepart;
  let km = 0;
  let minutesTrajet = 0;
  let respecte = true;
  const debuts: number[] = [];
  for (const e of etapes) {
    const t = trajetEstime(position, e);
    km += t.km;
    minutesTrajet += t.minutes;
    heure += t.minutes;
    if (e.debutMin !== undefined && heure < e.debutMin) heure = e.debutMin;
    if (e.debutMax !== undefined && heure > e.debutMax) respecte = false;
    debuts.push(heure);
    heure += e.dureeMin;
    position = e;
  }
  return {
    ordre: etapes.map((e) => e.id),
    km: Math.round(km * 10) / 10,
    minutesTrajet,
    debuts,
    respecteCreneaux: respecte,
  };
}

function permutations<T>(liste: T[]): T[][] {
  if (liste.length <= 1) return [liste];
  const res: T[][] = [];
  liste.forEach((x, i) => {
    const reste = [...liste.slice(0, i), ...liste.slice(i + 1)];
    for (const p of permutations(reste)) res.push([x, ...p]);
  });
  return res;
}

/** Tournée dans l'ordre donné (celui du planning actuel). */
export function tourneeTelleQuelle(depart: Point, etapes: Etape[], heureDepart: number) {
  return evaluer(depart, etapes, heureDepart);
}

/**
 * Meilleure tournée : toutes les permutations sont essayées (une journée compte
 * rarement plus de 6 passages, soit 720 ordres au plus). On garde la plus courte
 * qui respecte les créneaux ; s'il n'y en a aucune, l'ordre actuel est conservé.
 */
export function meilleureTournee(depart: Point, etapes: Etape[], heureDepart: number): Tournee {
  if (etapes.length > 8) throw new Error("Trop d'étapes pour une recherche exhaustive");
  const actuelle = evaluer(depart, etapes, heureDepart);
  let meilleure: Tournee | null = actuelle.respecteCreneaux ? actuelle : null;
  for (const p of permutations(etapes)) {
    const t = evaluer(depart, p, heureDepart);
    if (!t.respecteCreneaux) continue;
    if (!meilleure || t.km < meilleure.km - 1e-9) meilleure = t;
  }
  return meilleure ?? actuelle;
}

export function formaterHeure(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
