// La journée d'une personne tient-elle ? Les heures des clients sont fixes :
// on vérifie seulement que le trajet entre deux passages laisse le temps d'arriver.

import { trajetEstime, type Point } from "./geo";

/** Temps minimum souhaité entre l'arrivée estimée et le début du passage (trouver l'entrée, les clés). */
export const MARGE_CONFORT_MIN = 10;

export type PassagePlanifie = Point & { id: string; debut: number; duree: number };

export type EtapeVerifiee = {
  id: string;
  /** Minutes depuis minuit. */
  depart: number;
  trajetMin: number;
  km: number;
  arrivee: number;
  debut: number;
  fin: number;
  /** Arrivée prévue moins début du passage : négatif = retard. */
  marge: number;
  etat: "ok" | "juste" | "retard";
};

export type JourneeVerifiee = {
  etapes: EtapeVerifiee[];
  minutesMenage: number;
  minutesTrajet: number;
  km: number;
  tient: boolean;
  serres: number;
  retards: number;
};

/**
 * Départ du domicile juste à temps pour le premier passage, puis chaque trajet part
 * à la fin du passage précédent. Les passages se suivent dans l'ordre des heures.
 */
export function verifierJournee(domicile: Point, passages: PassagePlanifie[]): JourneeVerifiee {
  const tries = [...passages].sort((a, b) => a.debut - b.debut);
  const etapes: EtapeVerifiee[] = [];
  let position: Point = domicile;
  let libreA: number | null = null;
  for (const p of tries) {
    const t = trajetEstime(position, p);
    const depart: number = libreA ?? p.debut - t.minutes - MARGE_CONFORT_MIN;
    const arrivee = depart + t.minutes;
    const marge = p.debut - arrivee;
    const etat = marge < 0 ? "retard" : marge < MARGE_CONFORT_MIN ? "juste" : "ok";
    // En retard, le passage commence à l'arrivée et finit d'autant plus tard.
    const debutReel = Math.max(p.debut, arrivee);
    const fin = debutReel + p.duree;
    etapes.push({ id: p.id, depart, trajetMin: t.minutes, km: t.km, arrivee, debut: p.debut, fin, marge, etat });
    libreA = fin;
    position = p;
  }
  const retards = etapes.filter((e) => e.etat === "retard").length;
  return {
    etapes,
    minutesMenage: tries.reduce((s, p) => s + p.duree, 0),
    minutesTrajet: etapes.reduce((s, e) => s + e.trajetMin, 0),
    km: Math.round(etapes.reduce((s, e) => s + e.km, 0) * 10) / 10,
    tient: retards === 0,
    serres: etapes.filter((e) => e.etat === "juste").length,
    retards,
  };
}
