"use client";

// État de la démonstration, gardé dans le navigateur. Les envois (courriels, SMS,
// notifications) sont simulés : ils sont inscrits au journal, rien ne part.

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from "react";
import type { Canal, Destinataire, Note } from "./regles/notation";
import type { FicheLogement } from "./donnees";
import type { EtapeFilleul } from "./regles/parrainage";
import type { Candidature } from "./donnees/recrutement";

export type Alerte = {
  id: string;
  date: string;
  titre: string;
  detail: string;
  destinataires: (Destinataire & { message: string })[];
  lien: string;
  lue: boolean;
};

export type Envoi = {
  id: string;
  date: string;
  canal: Canal;
  destinataire: string;
  objet: string;
  corps: string;
  source: "ia" | "regles";
  modifieAvantEnvoi: boolean;
};

export type Pointage = { passageId: string; type: "arrivee" | "depart"; heure: string; distanceM: number };

type Etat = {
  alertes: Alerte[];
  notes: Note[];
  envois: Envoi[];
  fiches: Record<string, FicheLogement>;
  filleuls: Record<string, EtapeFilleul>;
  invitations: { id: string; prenom: string; email: string; zoneEnManque: boolean; date: string }[];
  decisions: Record<string, "appeler" | "plus-tard" | "refuser">;
  pointages: Pointage[];
  formation: Record<string, { bonnes: number; total: number; date: string }>;
  absence: { passageId: string; motif: string; remplacantId: string | null } | null;
  candidatures: Candidature[];
  zonesPrimeDoublee: string[];
  /** Vrai une fois l'état enregistré relu : avant, on n'écrit rien dans le stockage. */
  charge: boolean;
};

const VIDE: Etat = {
  alertes: [], notes: [], envois: [], fiches: {}, filleuls: {}, invitations: [], decisions: {}, pointages: [], formation: {}, absence: null, candidatures: [], zonesPrimeDoublee: [], charge: false,
};

type Action =
  | { type: "charger"; etat: Etat | null }
  | { type: "alerte"; alerte: Alerte }
  | { type: "lire-alertes" }
  | { type: "noter"; note: Note }
  | { type: "envoyer"; envoi: Envoi }
  | { type: "fiche"; clientId: string; fiche: FicheLogement }
  | { type: "filleul"; id: string; etape: EtapeFilleul }
  | { type: "inviter"; invitation: Etat["invitations"][number] }
  | { type: "decision"; id: string; decision: Etat["decisions"][string] }
  | { type: "pointer"; pointage: Pointage }
  | { type: "effacer-pointages"; passageId: string }
  | { type: "formation"; moduleId: string; bonnes: number; total: number }
  | { type: "absence"; absence: Etat["absence"] }
  | { type: "candidater"; candidature: Candidature }
  | { type: "prime-doublee"; commune: string; active: boolean }
  | { type: "reinitialiser" };

function reducteur(etat: Etat, a: Action): Etat {
  const maintenant = new Date().toISOString();
  switch (a.type) {
    case "charger": return { ...VIDE, ...(a.etat ?? {}), charge: true };
    case "alerte": return { ...etat, alertes: [a.alerte, ...etat.alertes] };
    case "lire-alertes": return { ...etat, alertes: etat.alertes.map((x) => ({ ...x, lue: true })) };
    case "noter": return { ...etat, notes: [a.note, ...etat.notes] };
    case "envoyer": return { ...etat, envois: [a.envoi, ...etat.envois] };
    case "fiche": return { ...etat, fiches: { ...etat.fiches, [a.clientId]: a.fiche } };
    case "filleul": return { ...etat, filleuls: { ...etat.filleuls, [a.id]: a.etape } };
    case "inviter": return { ...etat, invitations: [a.invitation, ...etat.invitations] };
    case "decision": return { ...etat, decisions: { ...etat.decisions, [a.id]: a.decision } };
    case "pointer": return { ...etat, pointages: [...etat.pointages.filter((p) => !(p.passageId === a.pointage.passageId && p.type === a.pointage.type)), a.pointage] };
    case "effacer-pointages": return { ...etat, pointages: etat.pointages.filter((p) => p.passageId !== a.passageId) };
    case "formation": return { ...etat, formation: { ...etat.formation, [a.moduleId]: { bonnes: a.bonnes, total: a.total, date: maintenant } } };
    case "absence": return { ...etat, absence: a.absence };
    case "candidater": return { ...etat, candidatures: [a.candidature, ...etat.candidatures] };
    case "prime-doublee": return {
      ...etat,
      zonesPrimeDoublee: a.active ? [...new Set([...etat.zonesPrimeDoublee, a.commune])] : etat.zonesPrimeDoublee.filter((z) => z !== a.commune),
    };
    case "reinitialiser": return { ...VIDE, charge: true };
  }
}

const CLE = "releve-simulation-v1";

type Contexte = { etat: Etat; envoyer: (a: Action) => void; nonLues: number; pret: boolean };
const SimulationContexte = createContext<Contexte | null>(null);

export function FournisseurSimulation({ children }: { children: React.ReactNode }) {
  const [etat, envoyer] = useReducer(reducteur, VIDE);

  useEffect(() => {
    let enregistre: Etat | null = null;
    try {
      const brut = localStorage.getItem(CLE);
      if (brut) enregistre = JSON.parse(brut) as Etat;
    } catch {
      // stockage indisponible (navigation privée) : la démonstration démarre à vide
    }
    envoyer({ type: "charger", etat: enregistre });
  }, []);

  // On n'écrit qu'une fois l'état enregistré relu : sinon le premier rendu (vide)
  // écraserait la démonstration en cours.
  useEffect(() => {
    if (!etat.charge) return;
    try {
      localStorage.setItem(CLE, JSON.stringify(etat));
    } catch {
      // idem
    }
  }, [etat]);

  const nonLues = etat.alertes.filter((a) => !a.lue).length;
  const valeur = useMemo(() => ({ etat, envoyer, nonLues, pret: etat.charge }), [etat, nonLues]);
  return <SimulationContexte.Provider value={valeur}>{children}</SimulationContexte.Provider>;
}

export function useSimulation() {
  const c = useContext(SimulationContexte);
  if (!c) throw new Error("FournisseurSimulation manquant");
  return c;
}

export function useIdentifiant() {
  return useCallback((prefixe: string) => `${prefixe}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`, []);
}
