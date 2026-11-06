// Recherche réelle sur travail.swiss, lancée par une personne depuis l'écran
// « Rechercher de nouveaux agents ». Rien n'est enregistré : la réponse ne
// contient que des champs anonymes et les liens vers les fiches officielles.

import { z } from "zod";
import { CANTONS_ROMANDS, rechercher, RELEVE_05_11_2026 } from "@/lib/jobroom";
import { dansLaLimite, memeOrigine } from "@/lib/protection";

const Criteres = z.object({
  canton: z.enum(CANTONS_ROMANDS),
  disponibilite: z.enum(["IMMEDIATE", "BY_ARRANGEMENT", "TOUTES"]),
  tauxMin: z.number().min(10).max(100),
  tauxMax: z.number().min(10).max(100),
  langues: z.array(z.enum(["fr", "en"])).max(2),
  experience: z.enum(["TOUTE", "MORE_THAN_1_YEAR", "MORE_THAN_3_YEARS"]),
});

// Libellés des métiers (publics), gardés en mémoire : ils ne changent pas.
const libelles = new Map<string, string>();

async function libelle(type: "AVAM" | "CHISCO5", code: number) {
  const cle = `${type}-${code}`;
  if (libelles.has(cle)) return libelles.get(cle)!;
  try {
    const r = await fetch(`https://www.job-room.ch/referenceservice/api/occupations/label/${type}/${code}?language=fr`, { signal: AbortSignal.timeout(5000) });
    const d = (await r.json()) as { default?: string };
    if (d.default) libelles.set(cle, d.default);
    return d.default ?? null;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  if (!memeOrigine(request)) return Response.json({ erreur: "origine" }, { status: 403 });
  // Recherche lancée par une personne : 20 en 10 minutes par adresse, 200 pour l'instance.
  if (!dansLaLimite(request, "jobroom", 20, 200)) return Response.json({ erreur: "limite", releve: RELEVE_05_11_2026 }, { status: 429, headers: { "Retry-After": "600" } });
  const analyse = Criteres.safeParse(await request.json().catch(() => null));
  if (!analyse.success) return Response.json({ erreur: "criteres" }, { status: 400 });
  try {
    const { total, profils } = await rechercher(analyse.data, 20, AbortSignal.timeout(15_000));
    const codes = [...new Set(profils.filter((p) => p.metierCode && p.metierCodeType).map((p) => `${p.metierCodeType}-${p.metierCode}`))];
    const noms = Object.fromEntries(
      await Promise.all(codes.map(async (c) => {
        const [type, code] = c.split("-");
        return [c, await libelle(type as "AVAM" | "CHISCO5", Number(code))] as const;
      })),
    );
    return Response.json({ total, profils, libelles: noms, horodatage: new Date().toISOString(), source: "travail.swiss" });
  } catch {
    return Response.json({ erreur: "indisponible", releve: RELEVE_05_11_2026 }, { status: 502 });
  }
}
