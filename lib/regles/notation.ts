// Notation dans les deux sens et alertes qualité.

export type Sens = "client-note-agent" | "agent-note-client";

export const SEUIL_ALERTE = 2;

export type Note = {
  id: string;
  sens: Sens;
  auteurId: string;
  cibleId: string;
  etoiles: number;
  commentaire: string;
  date: string;
};

export type Canal = "email" | "sms" | "push";

export type Destinataire = { role: "responsable-qualite" | "coordinateur" | "agent" | "client"; canal: Canal };

/** Une note de 1 ou 2 étoiles déclenche une alerte. */
export function declencheAlerte(etoiles: number) {
  if (!Number.isInteger(etoiles) || etoiles < 1 || etoiles > 5) throw new Error("Note invalide");
  return etoiles <= SEUIL_ALERTE;
}

/**
 * Qui est prévenu. Le bureau l'est toujours. La personne notée reçoit un message
 * d'accompagnement, pas la note brute ni le nom de l'auteur : on veut corriger,
 * pas créer un conflit entre l'agent et le client.
 */
export function destinatairesAlerte(sens: Sens, etoiles: number): Destinataire[] {
  if (!declencheAlerte(etoiles)) return [];
  const bureau: Destinataire[] = [
    { role: "responsable-qualite", canal: "email" },
    { role: "coordinateur", canal: "push" },
  ];
  const personneNotee: Destinataire =
    sens === "client-note-agent" ? { role: "agent", canal: "push" } : { role: "client", canal: "email" };
  return etoiles === 1 ? [...bureau, { role: "responsable-qualite", canal: "sms" }, personneNotee] : [...bureau, personneNotee];
}

/** Moyenne sur les notes reçues, arrondie au dixième. */
export function moyenne(notes: { etoiles: number }[]) {
  if (notes.length === 0) return null;
  return Math.round((notes.reduce((s, n) => s + n.etoiles, 0) / notes.length) * 10) / 10;
}

/** Tendance : moyenne des 3 dernières notes face à la moyenne générale. */
export function enBaisse(notes: { etoiles: number; date: string }[]) {
  if (notes.length < 4) return false;
  const triees = [...notes].sort((a, b) => a.date.localeCompare(b.date));
  const recentes = moyenne(triees.slice(-3))!;
  const generale = moyenne(triees)!;
  return recentes <= generale - 0.5;
}
