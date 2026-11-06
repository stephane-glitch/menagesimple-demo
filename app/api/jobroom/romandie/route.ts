// Totaux en direct pour l'accueil : personnes inscrites à l'ORP dans les métiers du
// ménage, par canton romand. Mis en cache une heure ; relevé du 05/11/2026 en secours.

import { connection } from "next/server";
import { rechercher, RELEVE_05_11_2026 } from "@/lib/jobroom";

const CANTONS = ["VD", "GE", "VS", "FR", "NE"] as const;
let cache: { a: number; donnees: unknown } | null = null;

export async function GET() {
  await connection(); // chiffres du jour : jamais calculés à la compilation
  if (cache && Date.now() - cache.a < 3_600_000) return Response.json(cache.donnees);
  try {
    const resultats = await Promise.all(
      CANTONS.map(async (canton) => {
        const base = { canton, tauxMin: 10, tauxMax: 100, langues: [], experience: "TOUTE" } as const;
        const [tous, immediat] = await Promise.all([
          rechercher({ ...base, langues: [], disponibilite: "TOUTES" }, 1, AbortSignal.timeout(12_000)),
          rechercher({ ...base, langues: [], disponibilite: "IMMEDIATE" }, 1, AbortSignal.timeout(12_000)),
        ]);
        return [canton, { total: tous.total, immediat: immediat.total }] as const;
      }),
    );
    const parCanton = Object.fromEntries(resultats);
    const romandie = resultats.reduce((s, [, v]) => ({ total: s.total + v.total, immediat: s.immediat + v.immediat }), { total: 0, immediat: 0 });
    const donnees = { direct: true, horodatage: new Date().toISOString(), parCanton, romandie };
    cache = { a: Date.now(), donnees };
    return Response.json(donnees);
  } catch (e) {
    console.error("travail.swiss injoignable pour l'accueil", e);
    return Response.json({ direct: false, horodatage: RELEVE_05_11_2026.date, parCanton: RELEVE_05_11_2026.parCanton, romandie: RELEVE_05_11_2026.romandie });
  }
}
