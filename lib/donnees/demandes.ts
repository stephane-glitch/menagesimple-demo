// Demandes d'intervention reçues, comme dans un outil de réservation de ménage.
// Clients et adresses inventés ; numéros postaux et communes réels.

import { TENSIONS, tauxCouverture } from "./index";

export type Prestation = "regulier" | "fond" | "fin-de-bail" | "repassage";

export type Demande = {
  id: string;
  recue: string; // date de réception
  client: string;
  rue: string;
  npa: string;
  commune: string;
  prestation: Prestation;
  frequence: "hebdomadaire" | "bimensuel" | "ponctuel";
  creneau: { fr: string; en: string };
  heures: number;
  statut: "a-attribuer" | "attribuee" | "en-attente";
  agent: string | null;
};

const C = (fr: string, en: string) => ({ fr, en });

export const DEMANDES: Demande[] = [
  { id: "D-2611", recue: "2026-11-09", client: "Mme Corinne Dutoit", rue: "Chemin du Reposoir 18", npa: "1260", commune: "Nyon", prestation: "regulier", frequence: "hebdomadaire", creneau: C("mardi matin", "Tuesday morning"), heures: 3, statut: "a-attribuer", agent: null },
  { id: "D-2610", recue: "2026-11-09", client: "Famille Lambelet", rue: "Avenue de Cour 61", npa: "1007", commune: "Lausanne", prestation: "regulier", frequence: "bimensuel", creneau: C("jeudi après-midi", "Thursday afternoon"), heures: 2.5, statut: "attribuee", agent: "Elsa Gashi" },
  { id: "D-2609", recue: "2026-11-09", client: "M. Thierry Rossier", rue: "Rue de la Colombière 9", npa: "1260", commune: "Nyon", prestation: "fin-de-bail", frequence: "ponctuel", creneau: C("vendredi 20 novembre", "Friday 20 November"), heures: 6, statut: "a-attribuer", agent: null },
  { id: "D-2608", recue: "2026-11-08", client: "Mme Aline Vuilleumier", rue: "Chemin de la Dôle 4", npa: "1196", commune: "Gland", prestation: "regulier", frequence: "hebdomadaire", creneau: C("jeudi matin", "Thursday morning"), heures: 2, statut: "a-attribuer", agent: null },
  { id: "D-2607", recue: "2026-11-08", client: "Famille Mottier", rue: "Rue du Lac 27", npa: "1815", commune: "Montreux", prestation: "fond", frequence: "ponctuel", creneau: C("samedi matin", "Saturday morning"), heures: 5, statut: "en-attente", agent: null },
  { id: "D-2606", recue: "2026-11-08", client: "M. et Mme Guignard", rue: "Avenue de Morges 112", npa: "1004", commune: "Lausanne", prestation: "repassage", frequence: "hebdomadaire", creneau: C("lundi matin", "Monday morning"), heures: 2, statut: "attribuee", agent: "Bruno Rochat" },
  { id: "D-2605", recue: "2026-11-07", client: "Mme Nathalie Berthoud", rue: "Rue de Lausanne 45", npa: "1950", commune: "Sion", prestation: "regulier", frequence: "bimensuel", creneau: C("vendredi matin", "Friday morning"), heures: 3, statut: "a-attribuer", agent: null },
  { id: "D-2604", recue: "2026-11-07", client: "Famille Zurbriggen", rue: "Route de Drize 6", npa: "1227", commune: "Carouge", prestation: "regulier", frequence: "hebdomadaire", creneau: C("lundi après-midi", "Monday afternoon"), heures: 2.5, statut: "a-attribuer", agent: null },
  { id: "D-2603", recue: "2026-11-07", client: "M. Pascal Junod", rue: "Grand-Rue 30", npa: "1110", commune: "Morges", prestation: "regulier", frequence: "bimensuel", creneau: C("mercredi matin", "Wednesday morning"), heures: 2, statut: "attribuee", agent: "Milica Jovanović" },
  { id: "D-2602", recue: "2026-11-06", client: "Mme Sophie Clerc", rue: "Rue du Simplon 12", npa: "1800", commune: "Vevey", prestation: "fond", frequence: "ponctuel", creneau: C("mardi 17 novembre", "Tuesday 17 November"), heures: 4, statut: "attribuee", agent: "Selam Tesfaye" },
  { id: "D-2601", recue: "2026-11-06", client: "Famille Rapin", rue: "Route de Gilly 8", npa: "1180", commune: "Rolle", prestation: "regulier", frequence: "hebdomadaire", creneau: C("mardi matin", "Tuesday morning"), heures: 3, statut: "en-attente", agent: null },
  { id: "D-2600", recue: "2026-11-06", client: "M. Olivier Favre", rue: "Rue de Carouge 88", npa: "1205", commune: "Genève", prestation: "repassage", frequence: "bimensuel", creneau: C("jeudi matin", "Thursday morning"), heures: 1.5, statut: "attribuee", agent: "Rosa Pereira" },
  { id: "D-2599", recue: "2026-11-05", client: "Mme Laura Chevalley", rue: "Avenue Alfred-Cortot 3", npa: "1260", commune: "Nyon", prestation: "regulier", frequence: "bimensuel", creneau: C("jeudi matin", "Thursday morning"), heures: 2.5, statut: "a-attribuer", agent: null },
  { id: "D-2598", recue: "2026-11-05", client: "Famille Overney", rue: "Route de Beaumont 20", npa: "1700", commune: "Fribourg", prestation: "regulier", frequence: "hebdomadaire", creneau: C("mercredi après-midi", "Wednesday afternoon"), heures: 3, statut: "attribuee", agent: "Hélène Dubois" },
  { id: "D-2597", recue: "2026-11-05", client: "M. Bernard Rey", rue: "Rue des Parcs 51", npa: "2000", commune: "Neuchâtel", prestation: "fin-de-bail", frequence: "ponctuel", creneau: C("lundi 30 novembre", "Monday 30 November"), heures: 7, statut: "attribuee", agent: "Daniela Moreno" },
];

export const PRESTATIONS: Record<Prestation, { fr: string; en: string }> = {
  regulier: C("Ménage régulier", "Regular cleaning"),
  fond: C("Ménage à fond", "Deep cleaning"),
  "fin-de-bail": C("Fin de bail", "End of lease"),
  repassage: C("Repassage", "Ironing"),
};

export const SEUIL_MANQUE = 75;

/** Une demande tombe dans une zone en manque quand l'offre couvre moins de 75 % de la demande. */
export function zoneDe(d: Demande) {
  const t = TENSIONS.find((z) => z.commune === d.commune);
  if (!t) return null;
  return { tension: t, couverture: tauxCouverture(t), enManque: tauxCouverture(t) < SEUIL_MANQUE };
}
