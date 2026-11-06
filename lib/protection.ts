import "server-only";

// Protections des routes serveur : requêtes venant seulement des pages du site,
// et nombre d'appels limité par adresse (au mieux : mémoire propre à chaque instance).

import { AsyncLocalStorage } from "node:async_hooks";

/** Vrai pendant le traitement d'une requête qui doit répondre sans IA (limite atteinte). */
export const sansIA = new AsyncLocalStorage<boolean>();

/** La requête vient-elle d'une page de ce site ? Bloque les autres sites et les scripts sans en-têtes de navigateur. */
export function memeOrigine(request: Request) {
  const site = request.headers.get("sec-fetch-site");
  if (site) return site === "same-origin";
  const origine = request.headers.get("origin");
  if (!origine) return false;
  try {
    return new URL(origine).host === new URL(request.url).host;
  } catch {
    return false;
  }
}

function adresse(request: Request) {
  return request.headers.get("x-real-ip") ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "inconnue";
}

const compteurs = new Map<string, number[]>();

/** Fenêtre glissante : au plus `max` appels par adresse sur `fenetreMs`, et `maxTotal` pour l'instance. */
export function dansLaLimite(request: Request, nom: string, max: number, maxTotal: number, fenetreMs = 10 * 60_000) {
  const maintenant = Date.now();
  const garder = (cle: string, limite: number) => {
    const liste = (compteurs.get(cle) ?? []).filter((t) => maintenant - t < fenetreMs);
    if (liste.length >= limite) { compteurs.set(cle, liste); return false; }
    liste.push(maintenant);
    compteurs.set(cle, liste);
    return true;
  };
  if (compteurs.size > 5000) compteurs.clear(); // garde-fou mémoire
  return garder(`${nom}:total`, maxTotal) && garder(`${nom}:${adresse(request)}`, max);
}
