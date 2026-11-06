// Choix d'un remplaçant quand un agent signale une absence.

import { distanceM, type Point } from "./geo";

export const RAYON_MAX_KM = 12;
export const PRIME_URGENCE_CHF_H = 5;
export const DELAI_URGENCE_H = 24;

export type Candidat = {
  id: string;
  position: Point;
  noteMoyenne: number;
  fiabilite: number;
  connaitLeClient: boolean;
  occupe: boolean;
  refuseParLeClient: boolean;
};

export type Proposition = { id: string; score: number; km: number; raisons: string[] };

/**
 * Jamais un agent déjà occupé, trop loin ou que le client a refusé.
 * Ensuite : connaître le client compte le plus (le remplacement passe mieux),
 * puis la proximité, la fiabilité et la note.
 */
export function classerRemplacants(logement: Point, candidats: Candidat[], nombre = 3): Proposition[] {
  return candidats
    .filter((c) => !c.occupe && !c.refuseParLeClient)
    .map((c) => {
      const km = distanceM(logement, c.position) / 1000;
      return { c, km };
    })
    .filter(({ km }) => km <= RAYON_MAX_KM)
    .map(({ c, km }) => {
      const raisons: string[] = [];
      let score = 0;
      if (c.connaitLeClient) {
        score += 40;
        raisons.push("connait");
      }
      score += Math.max(0, 25 - km * 2.5);
      if (km <= 3) raisons.push("proche");
      score += (c.fiabilite - 85) * 1.2;
      if (c.fiabilite >= 95) raisons.push("fiable");
      score += (c.noteMoyenne - 4) * 10;
      if (c.noteMoyenne >= 4.6) raisons.push("note");
      return { id: c.id, score: Math.round(score * 10) / 10, km: Math.round(km * 10) / 10, raisons };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, nombre);
}

/** Prime d'urgence pour le remplaçant quand le passage a lieu dans moins de 24 heures. */
export function primeUrgence(heuresAvantPassage: number, dureeH: number) {
  return heuresAvantPassage < DELAI_URGENCE_H ? Math.round(PRIME_URGENCE_CHF_H * dureeH * 100) / 100 : 0;
}
