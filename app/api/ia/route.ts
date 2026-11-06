// Point d'entrée unique des actions d'IA. Rien n'est enregistré côté serveur.

import { connection } from "next/server";
import { z } from "zod";
import * as actions from "@/lib/ia/actions";
import { fournisseur } from "@/lib/ia/serveur";
import { dansLaLimite, memeOrigine, sansIA } from "@/lib/protection";
import { zonesEnManque } from "@/lib/donnees";

const Langue = z.enum(["fr", "en"]);
const Fiche = z.object({
  routine: z.array(z.string()),
  preferences: z.array(z.string()),
  interdits: z.array(z.string()),
  acces: z.array(z.string()),
  miseAJour: z.string(),
}).nullable();

const Requete = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("classement"),
    besoin: z.string().max(1000),
    criteres: z.any(),
    profils: z.array(z.any()).max(50),
    langue: Langue,
  }),
  z.object({
    action: z.literal("message-orp"),
    commune: z.string().max(80),
    creneau: z.string().max(120),
    jours: z.string().max(60),
    taux: z.string().max(40),
    liens: z.array(z.string().url().startsWith("https://www.job-room.ch/")).max(10),
  }),
  z.object({
    action: z.literal("candidature"),
    langue: Langue,
    candidature: z.object({
      id: z.string().max(40), prenom: z.string().max(40), initialeNom: z.string().max(4), email: z.string().max(120),
      parrainId: z.string().max(10).nullable(), source: z.enum(["parrainage", "travail.swiss", "annonce"]), commune: z.string().max(60),
      permis: z.enum(["C", "B", "G", "suisse", "aucun"]), zones: z.array(z.string().max(60)).max(8), horaires: z.string().max(200),
      tauxSouhaite: z.number().min(10).max(100), experience: z.string().max(600), langues: z.array(z.string().max(8)).max(8),
      references: z.number().int().min(0).max(10), message: z.string().max(800),
      etape: z.enum(["invite", "candidature", "retenu", "refuse", "actif"]), heuresTravaillees: z.number().min(0), zoneEnManque: z.boolean(), date: z.string().max(30),
    }),
  }),
  z.object({ action: z.literal("reformuler"), transcription: z.string().min(5).max(4000), fiche: Fiche, langue: Langue }),
  z.object({
    action: z.literal("assistant"),
    question: z.string().min(2).max(1000),
    historique: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(4000) })).max(12),
    fiche: Fiche,
    langue: Langue,
  }),
  z.object({
    action: z.literal("alerte"),
    sens: z.enum(["client-note-agent", "agent-note-client"]),
    etoiles: z.number().int().min(1).max(2),
    commentaire: z.string().max(500),
    cibleNom: z.string().max(80),
    auteurNom: z.string().max(80),
    langue: Langue,
  }),
]);

export async function GET() {
  await connection(); // la clé peut être ajoutée après la compilation
  return Response.json({ ia: fournisseur() !== null });
}

export async function POST(request: Request) {
  if (!memeOrigine(request)) return Response.json({ erreur: "origine" }, { status: 403 });
  if (Number(request.headers.get("content-length") ?? 0) > 64_000) return Response.json({ erreur: "taille" }, { status: 413 });
  const analyse = Requete.safeParse(await request.json().catch(() => null));
  if (!analyse.success) return Response.json({ erreur: "requete" }, { status: 400 });
  // Au-delà de 40 appels en 10 minutes par adresse (400 pour l'instance), réponse par les règles simples.
  const limite = !dansLaLimite(request, "ia", 40, 400);
  return sansIA.run(limite, () => traiter(analyse.data));
}

async function traiter(r: z.infer<typeof Requete>) {
  switch (r.action) {
    case "classement":
      return Response.json(await actions.classement(r.profils, r.criteres, r.besoin, r.langue));
    case "message-orp":
      return Response.json(await actions.messageOrp(r));
    case "candidature":
      return Response.json(await actions.candidature(r.candidature, zonesEnManque().map((z) => z.commune), r.langue));
    case "reformuler":
      return Response.json(await actions.reformuler(r.transcription, r.fiche, r.langue));
    case "assistant":
      return Response.json(await actions.assistant(r.question, r.historique, r.fiche, r.langue));
    case "alerte":
      return Response.json(await actions.alerte(r, r.langue));
  }
}
