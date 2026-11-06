// Chaque texte affiché passe par t("français", "English") : on vérifie qu'aucun
// appel n'oublie l'anglais et qu'aucun écran n'oublie le sélecteur de langue.

import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { MODULES, CONSEILS } from "@/lib/donnees/formation";

const racine = join(__dirname, "..");

function fichiers(dossier: string): string[] {
  return readdirSync(dossier).flatMap((f) => {
    const chemin = join(dossier, f);
    if (statSync(chemin).isDirectory()) return fichiers(chemin);
    return chemin.endsWith(".tsx") ? [chemin] : [];
  });
}

const ecrans = [...fichiers(join(racine, "app")), ...fichiers(join(racine, "components"))];

describe("deux langues partout", () => {
  it("aucun appel t() avec une seule langue ou une traduction vide", () => {
    for (const f of ecrans) {
      const code = readFileSync(f, "utf8");
      expect(code, f).not.toMatch(/\bt\(\s*"[^"]*"\s*\)/);
      expect(code, f).not.toMatch(/\bt\(\s*"[^"]+"\s*,\s*""\s*\)/);
      expect(code, f).not.toMatch(/\bt\(\s*""\s*,/);
    }
  });

  it("le sélecteur de langue est dans l'en-tête commun à tous les écrans", () => {
    const layout = readFileSync(join(racine, "app/layout.tsx"), "utf8");
    const entete = readFileSync(join(racine, "components/en-tete.tsx"), "utf8");
    expect(layout).toContain("<Cadre>");
    expect(entete).toContain("<SelecteurLangue />");
  });

  it("modules de formation et fiches de l'assistant existent dans les deux langues", () => {
    for (const m of MODULES) {
      for (const p of m.points) expect(p.fr && p.en).toBeTruthy();
      for (const q of m.quiz) {
        expect(q.question.fr && q.question.en).toBeTruthy();
        expect(q.bonne).toBeLessThan(q.choix.length);
      }
    }
    for (const c of CONSEILS) for (const e of c.etapes) expect(e.fr && e.en).toBeTruthy();
  });
});
