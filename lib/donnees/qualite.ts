// Notes vocales d'exemple et historique de notation, fictifs.

import type { Note } from "../regles/notation";

export type NoteVocale = {
  id: string;
  agentId: string;
  clientId: string;
  duree: string;
  audio: string | null;
  transcription: string;
  date: string;
};

/** Ce que dit un agent en sortant d'un logement, tel qu'il le dit : oral, désordonné. */
export const NOTES_VOCALES: NoteVocale[] = [
  {
    id: "V1", agentId: "A001", clientId: "C001", duree: "0:32", audio: "/audio/note-rochat.mp3", date: "2026-11-03",
    transcription:
      "Alors chez les Rochat, euh, la dame m'a redit qu'il faut vraiment pas de javel dans la douche, c'est de la pierre, ça abîme. Elle préfère le savon noir. Et puis le petit est asthmatique donc rien qui sent fort, j'ai pris les produits sans parfum. Ah et il faut commencer par la cuisine parce qu'à dix heures le petit fait la sieste dans sa chambre, donc la chambre à la fin, euh non, la chambre avant dix heures en fait. Les jouets dans les bacs on les touche pas. La clé c'est toujours la boîte à clés.",
  },
  {
    id: "V2", agentId: "A001", clientId: "C003", duree: "0:16", audio: "/audio/note-favre.mp3", date: "2026-11-05",
    transcription:
      "Monsieur Favre, bon, il est content mais il veut que je repasse ses chemises, cinq chemises, sur des cintres, pas pliées. Le parquet du salon c'est du huilé, il m'a dit juste un chiffon humide, bien essoré. Et il y a un chat, il faut fermer la porte du balcon sinon il sort.",
  },
  {
    id: "V3", agentId: "A007", clientId: "C010", duree: "0:33", audio: null, date: "2026-11-06",
    transcription:
      "Pour madame chez Carouge là, elle était pas là, l'aspirateur marchait plus, le sac est plein et y'en a pas d'autres. Faut lui dire d'en racheter. Sinon elle veut toujours les vitres de la cuisine, et elle demande qu'on ne mette rien sur la table en bois, ni produit ni eau.",
  },
];

/** Historique de notes, dans les deux sens. */
export const NOTES_HISTORIQUE: Note[] = [
  { id: "N1", sens: "client-note-agent", auteurId: "C001", cibleId: "A001", etoiles: 5, commentaire: "Toujours parfait, et très discrète.", date: "2026-10-20" },
  { id: "N2", sens: "agent-note-client", auteurId: "A001", cibleId: "C001", etoiles: 5, commentaire: "Matériel prêt, accueil agréable.", date: "2026-10-20" },
  { id: "N3", sens: "client-note-agent", auteurId: "C002", cibleId: "A001", etoiles: 4, commentaire: "Bien, un peu de retard.", date: "2026-10-21" },
  { id: "N4", sens: "agent-note-client", auteurId: "A007", cibleId: "C010", etoiles: 2, commentaire: "Aspirateur en panne, pas de produits.", date: "2026-10-23" },
  { id: "N5", sens: "client-note-agent", auteurId: "C010", cibleId: "A007", etoiles: 4, commentaire: "Bon travail malgré le matériel.", date: "2026-10-23" },
  { id: "N6", sens: "client-note-agent", auteurId: "C014", cibleId: "A012", etoiles: 5, commentaire: "Impeccable.", date: "2026-10-27" },
  { id: "N7", sens: "client-note-agent", auteurId: "C022", cibleId: "A015", etoiles: 3, commentaire: "Salle de bain moyenne.", date: "2026-10-28" },
  { id: "N8", sens: "client-note-agent", auteurId: "C023", cibleId: "A015", etoiles: 3, commentaire: "Calcaire resté sur la paroi.", date: "2026-11-02" },
  { id: "N9", sens: "client-note-agent", auteurId: "C031", cibleId: "A015", etoiles: 2, commentaire: "Douche et robinets pas faits.", date: "2026-11-04" },
  { id: "N10", sens: "agent-note-client", auteurId: "A012", cibleId: "C014", etoiles: 5, commentaire: "Client très accueillant.", date: "2026-10-27" },
];
