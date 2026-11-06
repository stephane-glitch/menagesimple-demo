// Distances et trajets, calculés localement : aucune API de cartographie payante.

export type Point = { lat: number; lon: number };

const RAYON_TERRE_M = 6_371_000;

/** Distance à vol d'oiseau, en mètres (formule de haversine). */
export function distanceM(a: Point, b: Point): number {
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLon = rad(b.lon - a.lon);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * RAYON_TERRE_M * Math.asin(Math.sqrt(h));
}

/**
 * Les routes ne vont pas en ligne droite. On applique un coefficient de détour
 * (1,35, valeur courante en zone urbaine et périurbaine) et une vitesse moyenne
 * en transports publics ou en voiture de ville.
 */
export const COEFF_DETOUR = 1.35;
export const VITESSE_KMH = 22;

export function trajetEstime(a: Point, b: Point) {
  const km = (distanceM(a, b) / 1000) * COEFF_DETOUR;
  const minutes = Math.round((km / VITESSE_KMH) * 60);
  return { km: Math.round(km * 10) / 10, minutes };
}

/** Le pointage n'est accepté qu'à moins de ce rayon autour du logement. */
export const RAYON_POINTAGE_M = 150;

export function peutPointer(position: Point, logement: Point, rayon = RAYON_POINTAGE_M) {
  const d = distanceM(position, logement);
  return { autorise: d <= rayon, distanceM: Math.round(d) };
}
