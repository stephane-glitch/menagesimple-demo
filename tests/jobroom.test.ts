import { describe, expect, it } from "vitest";
import { anonymiser, corpsRecherche, METIERS, scoreProfil, URL_FICHE, type Criteres } from "@/lib/jobroom";

const base: Criteres = { canton: "VD", disponibilite: "IMMEDIATE", tauxMin: 30, tauxMax: 60, langues: ["fr"], experience: "MORE_THAN_1_YEAR" };

describe("requête travail.swiss", () => {
  it("cherche seulement dans les métiers du nettoyage, avec les codes relevés sur job-room.ch", () => {
    const corps = corpsRecherche(base);
    expect(corps.occupationCodes).toEqual([
      { id: "AVAM-102324-fr-default", type: "AVAM", value: "102324", mapping: { type: "BFS", value: "51103772" } },
      { id: "AVAM-102221-fr-default", type: "AVAM", value: "102221", mapping: { type: "BFS", value: "41103017" } },
    ]);
    expect(corps.residence).toEqual(["VD"]);
    expect(corps.availability).toBe("IMMEDIATE");
    expect(corps.experience).toBe("MORE_THAN_1_YEAR");
    expect(corps.languageSkills).toEqual([{ code: "fr" }]);
  });

  it("exige toutes les langues cochées", () => {
    expect(corpsRecherche({ ...base, langues: ["fr", "en"] }).languageSkills).toEqual([{ code: "fr" }, { code: "en" }]);
  });

  it("arrondit les taux à la dizaine et garde min ≤ max", () => {
    expect(corpsRecherche({ ...base, tauxMin: 34, tauxMax: 27 }).workLoad).toEqual({ min: 30, max: 30 });
    expect(corpsRecherche({ ...base, tauxMin: 0, tauxMax: 140 }).workLoad).toEqual({ min: 10, max: 100 });
  });

  it("« peu importe » vide les filtres de disponibilité, d'expérience et de langue", () => {
    const corps = corpsRecherche({ ...base, disponibilite: "TOUTES", experience: "TOUTE", langues: [] });
    expect(corps.availability).toBeNull();
    expect(corps.experience).toBeNull();
    expect(corps.languageSkills).toEqual([]);
  });

  it("transmet « à convenir » tel que travail.swiss l'attend", () => {
    expect(corpsRecherche({ ...base, disponibilite: "BY_ARRANGEMENT" }).availability).toBe("BY_ARRANGEMENT");
  });

  it("chaque métier a un libellé dans les deux langues", () => {
    for (const m of METIERS) expect(m.libelle.fr && m.libelle.en).toBeTruthy();
  });
});

describe("anonymisation des profils", () => {
  const brut = {
    candidateProfile: {
      id: "abc-123",
      gender: "FEMALE",
      availability: "IMMEDIATE",
      residenceCantonCode: "VD",
      workLoad: 50,
      preferredWorkCantons: ["VD", "GE"],
      jobExperiences: [
        { occupation: { avamCode: 101350 }, experience: "LESS_THAN_1_YEAR", lastJob: true },
        { occupation: { avamCode: 102324 }, experience: "MORE_THAN_3_YEARS", lastJob: false },
      ],
      languages: [{ code: "fr", spokenLevel: "PROFICIENT" }],
      drivingCategories: ["B"],
    },
    candidateContact: { email: "ne-doit-pas-sortir@exemple.test", phone: "+41 00 000 00 00" },
  };

  it("ne garde ni le genre ni les coordonnées", () => {
    const p = anonymiser(brut)!;
    const texte = JSON.stringify(p);
    expect(texte).not.toContain("FEMALE");
    expect(texte).not.toContain("exemple.test");
    expect(texte).not.toContain("+41");
    expect(Object.keys(p)).not.toContain("gender");
  });

  it("met en avant l'expérience dans le ménage plutôt que le dernier emploi", () => {
    const p = anonymiser(brut)!;
    expect(p.metierCode).toBe(102324);
    expect(p.experience).toBe("MORE_THAN_3_YEARS");
  });

  it("construit le lien vers la fiche officielle", () => {
    expect(anonymiser(brut)!.lien).toBe(`${URL_FICHE}abc-123`);
  });

  it("ignore un profil sans identifiant", () => {
    expect(anonymiser({ candidateProfile: {} })).toBeNull();
  });

  it("classe plus haut un profil du ménage disponible tout de suite", () => {
    const bon = anonymiser(brut)!;
    const autre = { ...bon, id: "x", metierCode: 101350, disponibilite: "LATER" };
    expect(scoreProfil(bon, base).score).toBeGreaterThan(scoreProfil(autre, base).score);
  });
});
