// Données fictives de démonstration. Communes et coordonnées réelles (centres
// approximatifs) ; personnes, rues et numéros inventés. Rien ne vient de MénageSimple.

import { creerAlea } from "../regles/prng";
import type { Point } from "../regles/geo";

export const JOUR_DEMO = "2026-11-10"; // mardi

export type Commune = { nom: string; canton: "VD" | "GE" | "VS" | "FR" | "NE"; lat: number; lon: number };

export const COMMUNES: Commune[] = [
  { nom: "Lausanne", canton: "VD", lat: 46.5197, lon: 6.6323 },
  { nom: "Renens", canton: "VD", lat: 46.5399, lon: 6.5881 },
  { nom: "Prilly", canton: "VD", lat: 46.5333, lon: 6.604 },
  { nom: "Pully", canton: "VD", lat: 46.5103, lon: 6.6623 },
  { nom: "Morges", canton: "VD", lat: 46.5113, lon: 6.4985 },
  { nom: "Rolle", canton: "VD", lat: 46.4587, lon: 6.3389 },
  { nom: "Gland", canton: "VD", lat: 46.4206, lon: 6.2702 },
  { nom: "Nyon", canton: "VD", lat: 46.3833, lon: 6.2396 },
  { nom: "Vevey", canton: "VD", lat: 46.4628, lon: 6.8419 },
  { nom: "Montreux", canton: "VD", lat: 46.4312, lon: 6.9107 },
  { nom: "Yverdon-les-Bains", canton: "VD", lat: 46.7785, lon: 6.6412 },
  { nom: "Genève", canton: "GE", lat: 46.2044, lon: 6.1432 },
  { nom: "Carouge", canton: "GE", lat: 46.184, lon: 6.1393 },
  { nom: "Lancy", canton: "GE", lat: 46.1896, lon: 6.1166 },
  { nom: "Meyrin", canton: "GE", lat: 46.2343, lon: 6.0802 },
  { nom: "Fribourg", canton: "FR", lat: 46.8065, lon: 7.162 },
  { nom: "Sion", canton: "VS", lat: 46.2331, lon: 7.3606 },
  { nom: "Neuchâtel", canton: "NE", lat: 46.99, lon: 6.9293 },
];

const PRENOMS = ["Ana", "Milica", "Fatima", "Sofia", "Lucía", "Mariana", "Elsa", "Jovana", "Aster", "Nadia", "Claire", "Inês", "Selam", "Rosa", "Hélène", "Yasmina", "Daniela", "Teresa", "Leila", "Marta", "Kevin", "Bruno", "Samuel", "Tomás", "Dragan", "Yonas", "Luca", "Arben", "Mehdi", "Paulo"];
const NOMS = ["Ferreira", "Jovanović", "Benali", "Gashi", "Moreno", "Costa", "Tesfaye", "Rochat", "Pereira", "Krasniqi", "Haddad", "Mendes", "Berisha", "Girard", "Okafor", "Silva", "Petrović", "Meier", "Nunes", "Kebede", "Dubois", "Rossi", "Hoxha", "Lopes", "Morel"];
const RUES = ["chemin des Glycines", "avenue du Léman", "rue des Tilleuls", "chemin de la Forêt", "route du Lac", "rue du Marché", "avenue des Alpes", "chemin des Vignes", "rue de la Gare", "chemin du Verger", "avenue de la Harpe", "rue du Midi"];
const NOMS_CLIENTS = ["Rochat", "Favre", "Blanc", "Perret", "Bovet", "Morand", "Chappuis", "Golay", "Monnier", "Rey", "Cuendet", "Jaquet", "Pittet", "Gonin", "Aubert", "Marmier", "Vuille", "Rapin", "Bonzon", "Mercier"];

export type Agent = {
  id: string;
  prenom: string;
  nom: string;
  commune: string;
  position: Point;
  langues: string[];
  moisAnciennete: number;
  noteMoyenne: number;
  fiabilite: number; // part des passages sans retard ni absence, en %
  heuresSemaine: number;
  modulesFaits: string[];
};

export type FicheLogement = {
  routine: string[];
  preferences: string[];
  interdits: string[];
  acces: string[];
  miseAJour: string;
};

export type Client = {
  id: string;
  nom: string;
  commune: string;
  adresse: string;
  position: Point;
  pieces: string;
  frequence: "hebdomadaire" | "bimensuel";
  agentHabituel: string;
  noteMoyenneRecue: number;
  fiche: FicheLogement;
};

const alea = creerAlea(20261110);

function autour(c: Commune, rayonKm: number): Point {
  const angle = alea.nombre() * Math.PI * 2;
  const d = Math.sqrt(alea.nombre()) * rayonKm;
  return {
    lat: Math.round((c.lat + (d / 111) * Math.cos(angle)) * 1e5) / 1e5,
    lon: Math.round((c.lon + (d / (111 * Math.cos((c.lat * Math.PI) / 180))) * Math.sin(angle)) * 1e5) / 1e5,
  };
}

const POIDS_COMMUNES = ["Lausanne", "Lausanne", "Lausanne", "Renens", "Prilly", "Pully", "Morges", "Morges", "Vevey", "Montreux", "Genève", "Genève", "Carouge", "Lancy", "Fribourg", "Sion", "Neuchâtel", "Yverdon-les-Bains"];

export const AGENTS: Agent[] = Array.from({ length: 40 }, (_, i) => {
  const nomTire = alea.choix(POIDS_COMMUNES);
  const commune = COMMUNES.find((c) => c.nom === nomTire)!;
  const langues = ["fr", ...alea.melanger(["pt", "es", "sq", "ti", "ar", "sr", "it", "en"]).slice(0, alea.entier(0, 2))];
  return {
    id: `A${String(i + 1).padStart(3, "0")}`,
    prenom: PRENOMS[i % PRENOMS.length],
    nom: NOMS[(i * 7) % NOMS.length],
    commune: commune.nom,
    position: autour(commune, 2.5),
    langues,
    moisAnciennete: alea.entier(2, 60),
    noteMoyenne: Math.round((3.9 + alea.nombre() * 1.1) * 10) / 10,
    fiabilite: alea.entier(86, 100),
    heuresSemaine: alea.entier(8, 32),
    modulesFaits: alea.melanger(["securite", "calcaire", "materiaux", "fin-de-bail", "discretion", "methode"]).slice(0, alea.entier(1, 5)),
  };
});

// L'agent de la démonstration côté téléphone.
AGENTS[0] = { ...AGENTS[0], prenom: "Ana", nom: "Ferreira", commune: "Lausanne", position: { lat: 46.5236, lon: 6.6198 }, langues: ["fr", "pt"], moisAnciennete: 26, noteMoyenne: 4.8, fiabilite: 97, heuresSemaine: 28, modulesFaits: ["securite", "calcaire", "discretion"] };

const ROUTINES = [
  ["Commencer par la cuisine", "Salle de bain ensuite", "Sols en dernier, de la chambre vers l'entrée"],
  ["Aérer en arrivant", "Chambres d'abord", "Cuisine et plan de travail", "Sols à la fin"],
  ["Salle de bain en premier", "Poussière du haut vers le bas", "Aspirateur puis serpillière"],
];
const PREFERENCES = ["Produits sans parfum", "Changer les draps toutes les deux semaines", "Plier le linge sur le lit", "Vinaigre blanc pour la douche", "Laisser les fenêtres entrouvertes", "Arroser les plantes du salon"];
const INTERDITS = ["Pas de javel (sol en marbre)", "Ne pas déplacer les papiers du bureau", "Ne pas utiliser l'aspirateur dans la chambre du bébé avant 10 h", "Pas de produit abrasif sur la plaque induction", "Ne pas laver le parquet à grande eau"];
const ACCES = ["Clé dans la boîte à clés, code donné par le bureau", "Chat d'appartement, ne pas le laisser sortir", "Sonner deux fois, interphone faible", "Parking visiteurs place 4"];

export const CLIENTS: Client[] = Array.from({ length: 60 }, (_, i) => {
  const nomTire = alea.choix(POIDS_COMMUNES);
  const commune = COMMUNES.find((c) => c.nom === nomTire)!;
  const agentsProches = AGENTS.filter((a) => a.commune === commune.nom);
  const agent = agentsProches.length ? alea.choix(agentsProches) : alea.choix(AGENTS);
  return {
    id: `C${String(i + 1).padStart(3, "0")}`,
    nom: `${alea.choix(["Famille", "M.", "Mme", "M. et Mme"])} ${NOMS_CLIENTS[i % NOMS_CLIENTS.length]}`,
    commune: commune.nom,
    adresse: `${alea.choix(RUES)} ${alea.entier(1, 48)}`,
    position: autour(commune, 2),
    pieces: alea.choix(["2,5 pièces", "3,5 pièces", "4,5 pièces", "5,5 pièces"]),
    frequence: alea.nombre() < 0.55 ? "bimensuel" : "hebdomadaire",
    agentHabituel: agent.id,
    noteMoyenneRecue: Math.round((3.8 + alea.nombre() * 1.2) * 10) / 10,
    fiche: {
      routine: alea.choix(ROUTINES),
      preferences: alea.melanger(PREFERENCES).slice(0, 2),
      interdits: alea.melanger(INTERDITS).slice(0, alea.entier(1, 2)),
      acces: alea.melanger(ACCES).slice(0, 1),
      miseAJour: "2026-10-27",
    },
  };
});

/** Journée d'Ana Ferreira, le mardi 10 novembre 2026, dans l'ordre du planning actuel. */
export type Passage = {
  id: string;
  clientId: string;
  agentId: string;
  dureeMin: number;
  debutMin?: number;
  debutMax?: number;
  creneau: string;
};

const clientsAna = [
  { nom: "Famille Rochat", commune: "Pully", adresse: "chemin des Vignes 14", position: { lat: 46.5121, lon: 6.6702 } },
  { nom: "Mme Golay", commune: "Prilly", adresse: "rue de la Gare 7", position: { lat: 46.5348, lon: 6.6012 } },
  { nom: "M. Favre", commune: "Lausanne", adresse: "avenue de la Harpe 31", position: { lat: 46.5108, lon: 6.6235 } },
  { nom: "M. et Mme Bovet", commune: "Renens", adresse: "chemin du Verger 3", position: { lat: 46.5411, lon: 6.5843 } },
  { nom: "Famille Pittet", commune: "Lausanne", adresse: "avenue du Léman 52", position: { lat: 46.5132, lon: 6.6461 } },
];

clientsAna.forEach((c, i) => {
  CLIENTS[i] = {
    ...CLIENTS[i],
    nom: c.nom,
    commune: c.commune,
    adresse: c.adresse,
    position: c.position,
    agentHabituel: "A001",
  };
});

CLIENTS[0].fiche = {
  routine: ["Commencer par la cuisine", "Salle de bain ensuite", "Chambres, puis sols de la chambre vers l'entrée"],
  preferences: ["Produits sans parfum (enfant asthmatique)", "Plier le linge sur le lit"],
  interdits: ["Pas de javel : sol de la douche en pierre naturelle", "Ne pas déplacer les jouets rangés dans les bacs"],
  acces: ["Clé dans la boîte à clés, code donné par le bureau"],
  miseAJour: "2026-10-27",
};

export const PASSAGES_ANA: Passage[] = [
  { id: "P1", clientId: "C001", agentId: "A001", dureeMin: 150, debutMin: 8 * 60, debutMax: 8 * 60 + 30, creneau: "08:00" },
  { id: "P2", clientId: "C002", agentId: "A001", dureeMin: 120, creneau: "libre" },
  { id: "P3", clientId: "C003", agentId: "A001", dureeMin: 90, creneau: "libre" },
  { id: "P4", clientId: "C004", agentId: "A001", dureeMin: 120, debutMin: 15 * 60, debutMax: 16 * 60, creneau: "15:00-16:00" },
  { id: "P5", clientId: "C005", agentId: "A001", dureeMin: 60, creneau: "libre" },
];

export const DOMICILE_ANA: Point = AGENTS[0].position;

/** Offre et demande de la semaine par commune, en heures. Base de la carte des zones en manque. */
export type Tension = { commune: string; canton: Commune["canton"]; demande: number; offre: number; creneauCritique: { fr: string; en: string } };

const CRENEAUX = [
  { fr: "mardi et jeudi matin", en: "Tuesday and Thursday mornings" },
  { fr: "lundi après-midi", en: "Monday afternoons" },
  { fr: "vendredi matin", en: "Friday mornings" },
  { fr: "mercredi, toute la journée", en: "Wednesdays, all day" },
  { fr: "samedi matin", en: "Saturday mornings" },
];

const TENSIONS_FIXEES: Record<string, [number, number, number]> = {
  Nyon: [146, 92, 0],
  Gland: [64, 38, 0],
  Montreux: [118, 84, 2],
  Carouge: [132, 101, 1],
  Sion: [88, 61, 4],
  Rolle: [41, 33, 0],
};

export const TENSIONS: Tension[] = COMMUNES.map((c) => {
  const fixe = TENSIONS_FIXEES[c.nom];
  if (fixe) return { commune: c.nom, canton: c.canton, demande: fixe[0], offre: fixe[1], creneauCritique: CRENEAUX[fixe[2]] };
  const demande = alea.entier(60, 320);
  return { commune: c.nom, canton: c.canton, demande, offre: Math.round(demande * (0.92 + alea.nombre() * 0.16)), creneauCritique: alea.choix(CRENEAUX) };
});

export function tauxCouverture(t: Tension) {
  return Math.round((t.offre / t.demande) * 100);
}

export function zonesEnManque(seuil = 85) {
  return TENSIONS.filter((t) => tauxCouverture(t) < seuil).sort((a, b) => tauxCouverture(a) - tauxCouverture(b));
}

export function client(id: string) {
  return CLIENTS.find((c) => c.id === id)!;
}

export function agent(id: string) {
  return AGENTS.find((a) => a.id === id)!;
}

export function commune(nom: string) {
  return COMMUNES.find((c) => c.nom === nom)!;
}
