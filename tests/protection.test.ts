import { describe, expect, it } from "vitest";
import { dansLaLimite, memeOrigine } from "@/lib/protection";

const req = (entetes: Record<string, string>) => new Request("https://trusquin.vercel.app/api/ia", { method: "POST", headers: entetes });

describe("protection des routes serveur", () => {
  it("accepte une requête venant d'une page du site", () => {
    expect(memeOrigine(req({ "sec-fetch-site": "same-origin" }))).toBe(true);
    expect(memeOrigine(req({ origin: "https://trusquin.vercel.app" }))).toBe(true);
  });

  it("refuse un autre site et un script sans en-têtes de navigateur", () => {
    expect(memeOrigine(req({ "sec-fetch-site": "cross-site" }))).toBe(false);
    expect(memeOrigine(req({ origin: "https://exemple.test" }))).toBe(false);
    expect(memeOrigine(req({}))).toBe(false);
  });

  it("limite le nombre d'appels par adresse", () => {
    const r = req({ "x-real-ip": "203.0.113.7" });
    const resultats = Array.from({ length: 5 }, () => dansLaLimite(r, "test-adresse", 3, 100));
    expect(resultats).toEqual([true, true, true, false, false]);
    expect(dansLaLimite(req({ "x-real-ip": "203.0.113.8" }), "test-adresse", 3, 100)).toBe(true);
  });

  it("limite aussi le total, toutes adresses confondues", () => {
    const ok = Array.from({ length: 4 }, (_, i) => dansLaLimite(req({ "x-real-ip": `198.51.100.${i}` }), "test-total", 10, 3));
    expect(ok).toEqual([true, true, true, false]);
  });
});
