"use client";

// Deux langues, choisies par le drapeau en haut à droite. Chaque texte est écrit
// dans les deux langues à l'endroit où il est utilisé : t("Bonjour", "Hello").

import { createContext, useCallback, useContext, useEffect, useMemo, useSyncExternalStore } from "react";

export type Langue = "fr" | "en";
export const COOKIE_LANGUE = "releve-langue";
const EVENEMENT = "releve-langue";

type Contexte = { langue: Langue; changer: (l: Langue) => void };

const LangueContexte = createContext<Contexte>({ langue: "fr", changer: () => {} });

// La langue vit dans un cookie lu par le navigateur : les pages restent statiques
// (rendues en français au serveur), puis basculent dès le chargement si besoin.
function lireCookie(): Langue {
  return /(?:^|;\s*)releve-langue=en(?:;|$)/.test(document.cookie) ? "en" : "fr";
}
function sAbonner(rappel: () => void) {
  window.addEventListener(EVENEMENT, rappel);
  return () => window.removeEventListener(EVENEMENT, rappel);
}

export function FournisseurLangue({ children }: { children: React.ReactNode }) {
  const langue = useSyncExternalStore(sAbonner, lireCookie, () => "fr" as Langue);

  const changer = useCallback((l: Langue) => {
    document.cookie = `${COOKIE_LANGUE}=${l}; path=/; max-age=31536000; samesite=lax`;
    window.dispatchEvent(new Event(EVENEMENT));
  }, []);

  useEffect(() => {
    document.documentElement.lang = langue;
  }, [langue]);

  const valeur = useMemo(() => ({ langue, changer }), [langue, changer]);
  return <LangueContexte.Provider value={valeur}>{children}</LangueContexte.Provider>;
}

export function useLangue() {
  return useContext(LangueContexte);
}

/** t("texte français", "English text") renvoie le texte de la langue choisie. */
export function useT() {
  const { langue } = useLangue();
  return useCallback((fr: string, en: string) => (langue === "fr" ? fr : en), [langue]);
}

/**
 * Mise en forme des nombres sans Intl : le serveur (Node) et le navigateur n'ont pas
 * toujours les mêmes données de langue, et un écart de séparateur casse l'hydratation.
 * Français de Suisse : espace fine insécable entre les milliers, virgule décimale.
 */
export function formaterNombre(n: number, langue: Langue, decimales = 0) {
  const [entier, fraction] = Math.abs(n).toFixed(decimales).split(".");
  const groupes = entier.replace(/\B(?=(\d{3})+(?!\d))/g, langue === "fr" ? "\u202f" : ",");
  return `${n < 0 ? "-" : ""}${groupes}${fraction ? (langue === "fr" ? "," : ".") + fraction : ""}`;
}

export function formaterCHF(n: number, langue: Langue) {
  return `CHF ${formaterNombre(n, langue, 2)}`;
}
