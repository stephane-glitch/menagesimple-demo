import { describe, expect, it } from "vitest";
import { MARGE_CONFORT_MIN, verifierJournee } from "@/lib/regles/planning";
import { PLANNINGS } from "@/lib/donnees/plannings";

const journee = (id: string) => {
  const p = PLANNINGS.find((x) => x.id === id)!;
  return verifierJournee(p.domicile, p.passages.map((x) => ({ id: x.id, debut: x.debut, duree: x.duree, ...x.position })));
};

describe("planning d'une personne", () => {
  it("part de chez soi avec la marge de confort avant le premier passage", () => {
    const e = journee("A001").etapes[0];
    expect(e.marge).toBe(MARGE_CONFORT_MIN);
    expect(e.etat).toBe("ok");
  });

  it("la journée d'Ana tient sans enchaînement serré", () => {
    const j = journee("A001");
    expect(j.tient).toBe(true);
    expect(j.minutesMenage).toBe(420);
    expect(j.serres).toBe(0);
  });

  it("la journée d'Elsa ne tient pas : Gland est trop loin de Nyon pour 11 h 15", () => {
    const j = journee("A007");
    expect(j.tient).toBe(false);
    expect(j.etapes[1].etat).toBe("retard");
    // le retard se reporte sur la fin du passage
    expect(j.etapes[1].fin).toBe(j.etapes[1].arrivee + 120);
  });

  it("la journée d'Hélène tient, mais un enchaînement est serré", () => {
    const j = journee("A015");
    expect(j.tient).toBe(true);
    expect(j.serres).toBeGreaterThan(0);
  });

  it("trie les passages par heure", () => {
    const j = verifierJournee({ lat: 46.5, lon: 6.6 }, [
      { id: "b", debut: 600, duree: 60, lat: 46.5, lon: 6.6 },
      { id: "a", debut: 480, duree: 60, lat: 46.5, lon: 6.6 },
    ]);
    expect(j.etapes.map((e) => e.id)).toEqual(["a", "b"]);
  });
});
