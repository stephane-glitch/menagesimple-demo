// Plannings fictifs du mardi 10 novembre 2026 : heures fixées par les clients.

import type { Point } from "../regles/geo";

type T = { fr: string; en: string };
export type PassageJour = { id: string; client: string; adresse: string; commune: string; position: Point; debut: number; duree: number };
export type PlanningPersonne = { id: string; prenom: string; nom: string; commune: string; domicile: Point; transport: T; passages: PassageJour[] };

const h = (heure: number, minutes = 0) => heure * 60 + minutes;

export const PLANNINGS: PlanningPersonne[] = [
  {
    id: "A001", prenom: "Ana", nom: "Ferreira", commune: "Lausanne", domicile: { lat: 46.5235, lon: 6.6279 },
    transport: { fr: "transports publics", en: "public transport" },
    passages: [
      { id: "J1", client: "Famille Rochat", adresse: "chemin des Vignes 14", commune: "Pully", position: { lat: 46.5121, lon: 6.6702 }, debut: h(8), duree: 150 },
      { id: "J2", client: "M. Favre", adresse: "avenue de la Harpe 31", commune: "Lausanne", position: { lat: 46.5108, lon: 6.6235 }, debut: h(11), duree: 90 },
      { id: "J3", client: "Famille Pittet", adresse: "avenue du Léman 52", commune: "Lausanne", position: { lat: 46.5132, lon: 6.6461 }, debut: h(13, 30), duree: 60 },
      { id: "J4", client: "M. et Mme Bovet", adresse: "chemin du Verger 3", commune: "Renens", position: { lat: 46.5411, lon: 6.5843 }, debut: h(15, 15), duree: 120 },
    ],
  },
  {
    id: "A007", prenom: "Elsa", nom: "Meier", commune: "Nyon", domicile: { lat: 46.3801, lon: 6.2342 },
    transport: { fr: "transports publics", en: "public transport" },
    passages: [
      { id: "E1", client: "Famille Rey", adresse: "route du Lac 8", commune: "Nyon", position: { lat: 46.3812, lon: 6.2441 }, debut: h(8), duree: 180 },
      { id: "E2", client: "Mme Chappuis", adresse: "rue du Midi 5", commune: "Gland", position: { lat: 46.4219, lon: 6.2688 }, debut: h(11, 15), duree: 120 },
      { id: "E3", client: "M. Monnier", adresse: "avenue des Alpes 19", commune: "Rolle", position: { lat: 46.4593, lon: 6.3372 }, debut: h(13, 30), duree: 90 },
      { id: "E4", client: "Famille Cuendet", adresse: "chemin de la Forêt 2", commune: "Nyon", position: { lat: 46.3889, lon: 6.2291 }, debut: h(15, 30), duree: 120 },
    ],
  },
  {
    id: "A015", prenom: "Hélène", nom: "Lopes", commune: "Vevey", domicile: { lat: 46.4635, lon: 6.8432 },
    transport: { fr: "voiture", en: "car" },
    passages: [
      { id: "H1", client: "Mme Aubert", adresse: "rue des Tilleuls 11", commune: "Vevey", position: { lat: 46.4611, lon: 6.8462 }, debut: h(8, 30), duree: 120 },
      { id: "H2", client: "M. Rapin", adresse: "avenue des Alpes 40", commune: "Montreux", position: { lat: 46.4329, lon: 6.9121 }, debut: h(10, 58), duree: 120 },
      { id: "H3", client: "Famille Bonzon", adresse: "chemin des Glycines 6", commune: "Vevey", position: { lat: 46.4652, lon: 6.8376 }, debut: h(14), duree: 150 },
    ],
  },
];
