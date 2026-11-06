import { describe, expect, it } from "vitest";
import { contient, repliAlerte, repliAssistant, repliCandidature, repliClassement, repliMessageOrp, repliReformuler } from "@/lib/ia/repli";
import { CANDIDATURES } from "@/lib/donnees/recrutement";
import { NOTES_VOCALES } from "@/lib/donnees/qualite";
import { anonymiser } from "@/lib/jobroom";

describe("classement sans IA", () => {
  it("ne renvoie que des identifiants existants, avec une raison lisible", () => {
    const profils = [
      anonymiser({ candidateProfile: { id: "p1", availability: "IMMEDIATE", residenceCantonCode: "VD", workLoad: 50, jobExperiences: [{ occupation: { avamCode: 102324 }, experience: "MORE_THAN_3_YEARS", lastJob: true }], languages: [{ code: "fr", spokenLevel: "PROFICIENT" }] } })!,
      anonymiser({ candidateProfile: { id: "p2", availability: "LATER", residenceCantonCode: "GE", workLoad: 100, jobExperiences: [{ occupation: { avamCode: 101350 }, lastJob: true }] } })!,
    ];
    const r = repliClassement(profils, { canton: "VD", disponibilite: "IMMEDIATE", tauxMin: 30, tauxMax: 60, langues: ["fr"], experience: "TOUTE" }, "fr");
    expect(r.selection[0].id).toBe("p1");
    expect(r.selection.every((s) => ["p1", "p2"].includes(s.id))).toBe(true);
    expect(r.selection[0].raison).toContain("métier du ménage");
  });
});

describe("message à l'ORP sans IA", () => {
  it("reprend tous les liens et ne cite aucun montant", () => {
    const liens = ["https://www.job-room.ch/candidate-search/a", "https://www.job-room.ch/candidate-search/b"];
    const m = repliMessageOrp({ commune: "Nyon", creneau: "le matin", jours: "2 jours par semaine", taux: "30 à 60 %", liens });
    expect(m.corps).toContain("2 jours par semaine");
    for (const l of liens) expect(m.corps).toContain(l);
    expect(m.corps).not.toMatch(/CHF|€|\bfr\.\s*\d/);
  });
});

describe("présélection sans IA", () => {
  it("signale l'absence d'autorisation de travail sans rien refuser", () => {
    const paulo = CANDIDATURES.find((c) => c.id === "K07")!;
    const r = repliCandidature(paulo, [], "fr");
    expect(r.aVerifier.join(" ")).toMatch(/autorisation de travail/);
    expect(r.suggestion).toBe("a-voir");
  });

  it("valorise une zone en manque", () => {
    const rita = CANDIDATURES.find((c) => c.id === "K01")!;
    const r = repliCandidature(rita, ["Nyon"], "en");
    expect(r.pointsForts.join(" ")).toContain("short-staffed");
    expect(r.suggestion).toBe("appeler");
  });
});

describe("reformulation sans IA", () => {
  it("reconnaît les mots entiers, accents compris", () => {
    expect(contient("bien essoré.", ["essoré"])).toBe(true);
    expect(contient("chez les Rochat", ["chat"])).toBe(false);
    expect(contient("la clé est là", ["clé"])).toBe(true);
  });

  it("range la note des Rochat dans les bonnes rubriques et garde la correction de l'agent", () => {
    const r = repliReformuler(NOTES_VOCALES[0].transcription, "fr");
    expect(r.interdits.join(" ")).toMatch(/javel/);
    expect(r.acces.join(" ")).toMatch(/boîte à clés/);
    expect(r.routine.join(" ")).toMatch(/chambre avant dix heures/i);
    expect(r.routine.join(" ")).not.toMatch(/chambre à la fin/i);
  });

  it("met la panne de matériel à signaler au bureau, pas dans la fiche", () => {
    const r = repliReformuler(NOTES_VOCALES[2].transcription, "fr");
    expect(r.aSignaler.join(" ")).toMatch(/aspirateur/);
    expect([...r.preferences, ...r.interdits, ...r.routine, ...r.acces].join(" ")).not.toMatch(/aspirateur/);
  });
});

describe("assistant ménage sans IA", () => {
  it("répond par une fiche et rappelle les interdits du logement", () => {
    const r = repliAssistant("Comment enlever le calcaire de la douche ?", "fr", ["Pas de javel : pierre naturelle"]);
    expect(r.reponse).toMatch(/vinaigre/);
    expect(r.reponse).toMatch(/pierre naturelle/);
  });

  it("dit honnêtement quand il ne sait pas", () => {
    expect(repliAssistant("Quel temps fera-t-il demain ?", "en").reponse).toMatch(/don't have a sheet/);
  });
});

describe("alerte sans IA", () => {
  it("ne cite ni la note ni l'auteur dans le message à la personne notée", () => {
    const m = repliAlerte({ sens: "client-note-agent", etoiles: 1, commentaire: "retard", cibleNom: "Ana Ferreira", auteurNom: "Famille Rochat" }, "fr");
    expect(m.messagePersonne).not.toMatch(/Rochat|1\/5|étoile/);
    expect(m.messageBureau).toMatch(/Rochat/);
  });
});
