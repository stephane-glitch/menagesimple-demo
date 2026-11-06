// Parrainage et candidatures fictives.

import type { EtapeFilleul } from "../regles/parrainage";

export type Candidature = {
  id: string;
  prenom: string;
  initialeNom: string;
  email: string;
  parrainId: string | null;
  source: "parrainage" | "travail.swiss" | "annonce";
  commune: string;
  permis: "C" | "B" | "G" | "suisse" | "aucun";
  zones: string[];
  horaires: string;
  tauxSouhaite: number;
  experience: string;
  langues: string[];
  references: number;
  message: string;
  etape: EtapeFilleul;
  heuresTravaillees: number;
  zoneEnManque: boolean;
  date: string;
};

export const CANDIDATURES: Candidature[] = [
  {
    id: "K01", prenom: "Rita", initialeNom: "M.", email: "rita.m@exemple.test", parrainId: "A001", source: "parrainage",
    commune: "Nyon", permis: "C", zones: ["Nyon", "Gland", "Rolle"], horaires: "mardi et jeudi matin, vendredi", tauxSouhaite: 50,
    experience: "4 ans de ménage chez des particuliers à Lisbonne, 1 an en hôtellerie à Genève", langues: ["pt", "fr", "es"], references: 2,
    message: "Je suis la cousine d'Ana. Je cherche des heures le matin, mes enfants sont à l'école.", etape: "candidature", heuresTravaillees: 0, zoneEnManque: true, date: "2026-11-06",
  },
  {
    id: "K02", prenom: "Bereket", initialeNom: "T.", email: "bereket.t@exemple.test", parrainId: "A007", source: "parrainage",
    commune: "Lausanne", permis: "B", zones: ["Lausanne", "Renens", "Prilly"], horaires: "tous les jours sauf le mercredi", tauxSouhaite: 80,
    experience: "2 ans de nettoyage de bureaux en équipe de soir", langues: ["ti", "en", "fr"], references: 1,
    message: "J'aimerais travailler la journée plutôt que le soir.", etape: "retenu", heuresTravaillees: 12, zoneEnManque: false, date: "2026-10-22",
  },
  {
    id: "K03", prenom: "Julie", initialeNom: "P.", email: "julie.p@exemple.test", parrainId: "A012", source: "parrainage",
    commune: "Montreux", permis: "suisse", zones: ["Montreux", "Vevey"], horaires: "lundi et mercredi", tauxSouhaite: 30,
    experience: "Pas d'expérience professionnelle, tient la maison de sa grand-mère depuis 3 ans", langues: ["fr", "de"], references: 0,
    message: "Étudiante en 2e année, je cherche un complément stable.", etape: "actif", heuresTravaillees: 34, zoneEnManque: true, date: "2026-09-30",
  },
  {
    id: "K04", prenom: "Dragana", initialeNom: "S.", email: "dragana.s@exemple.test", parrainId: "A001", source: "parrainage",
    commune: "Morges", permis: "C", zones: ["Morges", "Lausanne"], horaires: "flexible", tauxSouhaite: 60,
    experience: "6 ans femme de chambre dans un hôtel 4 étoiles", langues: ["sr", "fr", "de"], references: 3,
    message: "", etape: "actif", heuresTravaillees: 41, zoneEnManque: false, date: "2026-09-15",
  },
  {
    id: "K05", prenom: "Loïc", initialeNom: "L.", email: "loic.l@exemple.test", parrainId: "A021", source: "parrainage",
    commune: "Carouge", permis: "G", zones: ["Carouge", "Lancy", "Genève"], horaires: "après-midi", tauxSouhaite: 40,
    experience: "1 an d'aide à domicile en France voisine", langues: ["fr"], references: 1,
    message: "Frontalier, j'habite à Annemasse.", etape: "invite", heuresTravaillees: 0, zoneEnManque: true, date: "2026-11-08",
  },
  {
    id: "K06", prenom: "Amira", initialeNom: "B.", email: "amira.b@exemple.test", parrainId: null, source: "travail.swiss",
    commune: "Gland", permis: "B", zones: ["Gland", "Nyon"], horaires: "matin", tauxSouhaite: 50,
    experience: "3 ans d'intendance dans un EMS", langues: ["ar", "fr"], references: 2,
    message: "Contactée par l'intermédiaire de ma conseillère ORP.", etape: "candidature", heuresTravaillees: 0, zoneEnManque: true, date: "2026-11-09",
  },
  {
    id: "K07", prenom: "Paulo", initialeNom: "R.", email: "paulo.r@exemple.test", parrainId: "A001", source: "parrainage",
    commune: "Lausanne", permis: "aucun", zones: ["Lausanne"], horaires: "flexible", tauxSouhaite: 100,
    experience: "Ménage occasionnel", langues: ["pt"], references: 0,
    message: "", etape: "refuse", heuresTravaillees: 0, zoneEnManque: false, date: "2026-10-03",
  },
];

export const COORDONNEES_BUREAU = { nom: "MénageSimple, recrutement", email: "recrutement@exemple.test" };
