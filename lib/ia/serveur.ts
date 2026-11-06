import "server-only";

// Appels à l'IA, côté serveur uniquement. Les clés ne sont jamais envoyées au navigateur.
// Fournisseur choisi d'après les clés présentes : Claude (ANTHROPIC_API_KEY), sinon
// Gemini (GEMINI_API_KEY). Sans clé ou en cas d'échec, chaque action renvoie la réponse
// de secours (lib/ia/repli.ts) et l'écran l'indique : la démonstration reste utilisable.

import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { sansIA } from "../protection";

const MODELE_CLAUDE = "claude-opus-5-5";
const MODELE_GEMINI = process.env.GEMINI_MODEL || "gemini-3.5-flash";

export type Fournisseur = "claude" | "gemini";

export function fournisseur(): Fournisseur | null {
  if (sansIA.getStore()) return null; // limite d'appels atteinte : règles simples, sans coût
  if (process.env.ANTHROPIC_API_KEY) return "claude";
  if (process.env.GEMINI_API_KEY) return "gemini";
  return null;
}

export function modele() {
  const f = fournisseur();
  return f === "claude" ? MODELE_CLAUDE : f === "gemini" ? MODELE_GEMINI : null;
}

let client: Anthropic | null = null;
function clientClaude() {
  // baseURL fixée : on ne veut pas hériter d'une variable ANTHROPIC_BASE_URL de l'environnement.
  client ??= new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, baseURL: "https://api.anthropic.com", maxRetries: 1, timeout: 60_000 });
  return client;
}

const SYSTEME_COMMUN = `Tu travailles dans l'outil interne de MénageSimple, une agence de placement de personnel de ménage chez des particuliers, en Suisse romande.
Tes textes sont toujours relus et validés par une personne avant tout envoi : tu proposes, tu ne décides pas.
Écris court, concret, dans le vocabulaire d'une petite entreprise de services. N'invente jamais un fait, un nom, un chiffre ou une promesse absents des données fournies.`;

export type Resultat<T> = { donnees: T; source: "ia" | "regles"; erreur?: string };

class ErreurIA extends Error {
  constructor(public code: string) {
    super(code);
  }
}

type Message = { role: "user" | "assistant"; content: string };

async function claude(systeme: string, messages: Message[], schema: Record<string, unknown> | null, effort: "low" | "medium" | "high") {
  try {
    const reponse = await clientClaude().beta.messages.create({
      model: MODELE_CLAUDE,
      max_tokens: 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: systeme,
      output_config: schema ? { effort, format: { type: "json_schema", schema } } : { effort },
      messages,
    });
    if (reponse.stop_reason === "refusal") throw new ErreurIA("refus");
    return reponse.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("").trim();
  } catch (e) {
    if (e instanceof ErreurIA) throw e;
    throw new ErreurIA(
      e instanceof Anthropic.AuthenticationError ? "cle" :
      e instanceof Anthropic.RateLimitError ? "limite" :
      e instanceof Anthropic.APIError ? `api-${e.status}` : "reseau",
    );
  }
}

type ReponseGemini = {
  candidates?: { content?: { parts?: { text?: string; thought?: boolean }[] }; finishReason?: string }[];
  promptFeedback?: { blockReason?: string };
};

async function gemini(systeme: string, messages: Message[], schema: Record<string, unknown> | null) {
  let reponse: Response;
  try {
    reponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODELE_GEMINI}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY ?? "" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systeme }] },
        contents: messages.map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] })),
        generationConfig: schema ? { responseMimeType: "application/json", responseJsonSchema: schema } : {},
      }),
      signal: AbortSignal.timeout(60_000),
    });
  } catch {
    throw new ErreurIA("reseau");
  }
  if (reponse.status === 401 || reponse.status === 403) throw new ErreurIA("cle");
  if (reponse.status === 429) throw new ErreurIA("limite");
  if (!reponse.ok) throw new ErreurIA(`api-${reponse.status}`);
  const d = (await reponse.json()) as ReponseGemini;
  if (d.promptFeedback?.blockReason || d.candidates?.[0]?.finishReason === "SAFETY") throw new ErreurIA("refus");
  return (d.candidates?.[0]?.content?.parts ?? []).filter((p) => !p.thought).map((p) => p.text ?? "").join("").trim();
}

function appeler(systeme: string, messages: Message[], schema: Record<string, unknown> | null, effort: "low" | "medium" | "high") {
  return fournisseur() === "claude" ? claude(systeme, messages, schema, effort) : gemini(systeme, messages, schema);
}

/**
 * Appel structuré : l'IA répond en JSON conforme au schéma, validé ensuite par zod.
 * Le repli est utilisé si l'IA n'est pas configurée, refuse, ou renvoie un JSON invalide.
 */
export async function appelStructure<T>(p: {
  consigne: string;
  contenu: string;
  schemaJson: Record<string, unknown>;
  valider: z.ZodType<T>;
  repli: () => T;
  effort?: "low" | "medium" | "high";
}): Promise<Resultat<T>> {
  if (!fournisseur()) return { donnees: p.repli(), source: "regles" };
  try {
    const texte = await appeler(`${SYSTEME_COMMUN}\n\n${p.consigne}`, [{ role: "user", content: p.contenu }], p.schemaJson, p.effort ?? "low");
    const analyse = p.valider.safeParse(JSON.parse(texte));
    if (!analyse.success) return { donnees: p.repli(), source: "regles", erreur: "format" };
    return { donnees: analyse.data, source: "ia" };
  } catch (e) {
    return { donnees: p.repli(), source: "regles", erreur: e instanceof ErreurIA ? e.code : "format" };
  }
}

/** Appel en texte libre (assistant ménage). */
export async function appelTexte(p: { consigne: string; messages: Message[]; repli: () => string }): Promise<Resultat<string>> {
  if (!fournisseur()) return { donnees: p.repli(), source: "regles" };
  try {
    const texte = await appeler(`${SYSTEME_COMMUN}\n\n${p.consigne}`, p.messages, null, "low");
    return texte ? { donnees: texte, source: "ia" } : { donnees: p.repli(), source: "regles", erreur: "vide" };
  } catch (e) {
    return { donnees: p.repli(), source: "regles", erreur: e instanceof ErreurIA ? e.code : "reseau" };
  }
}
