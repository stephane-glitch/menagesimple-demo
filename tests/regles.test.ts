import { describe, expect, it } from "vitest";
import { distanceM, peutPointer, RAYON_POINTAGE_M, trajetEstime } from "@/lib/regles/geo";
import { meilleureTournee, tourneeTelleQuelle, type Etape } from "@/lib/regles/itineraire";
import { codeParrainage, dejaParraine, primesDues } from "@/lib/regles/parrainage";
import { declencheAlerte, destinatairesAlerte, enBaisse, moyenne } from "@/lib/regles/notation";
import { classerRemplacants, primeUrgence, type Candidat } from "@/lib/regles/remplacement";
import { client, DOMICILE_ANA, PASSAGES_ANA, AGENTS, CLIENTS, zonesEnManque, tauxCouverture } from "@/lib/donnees";

describe("distances et pointage", () => {
  it("mesure Lausanne – Genève autour de 51 km à vol d'oiseau", () => {
    const km = distanceM({ lat: 46.5197, lon: 6.6323 }, { lat: 46.2044, lon: 6.1432 }) / 1000;
    expect(km).toBeGreaterThan(49);
    expect(km).toBeLessThan(53);
  });

  it("applique le coefficient de détour au trajet", () => {
    const a = { lat: 46.5, lon: 6.6 };
    const b = { lat: 46.51, lon: 6.6 };
    expect(trajetEstime(a, b).km).toBeCloseTo((distanceM(a, b) / 1000) * 1.35, 1);
  });

  it("n'ouvre le pointage qu'à moins de 150 m", () => {
    const logement = { lat: 46.5121, lon: 6.6702 };
    expect(peutPointer({ lat: 46.51216, lon: 6.67035 }, logement).autorise).toBe(true);
    expect(peutPointer({ lat: 46.5098, lon: 6.6608 }, logement).autorise).toBe(false);
    const juste = peutPointer({ lat: 46.5121 + (RAYON_POINTAGE_M + 5) / 111_000, lon: 6.6702 }, logement);
    expect(juste.autorise).toBe(false);
  });
});

describe("tournée du jour", () => {
  const etapes: Etape[] = PASSAGES_ANA.map((p) => ({ id: p.id, ...client(p.clientId).position, dureeMin: p.dureeMin, debutMin: p.debutMin, debutMax: p.debutMax }));

  it("trouve un ordre plus court que le planning actuel", () => {
    const actuelle = tourneeTelleQuelle(DOMICILE_ANA, etapes, 450);
    const meilleure = meilleureTournee(DOMICILE_ANA, etapes, 450);
    expect(meilleure.km).toBeLessThan(actuelle.km);
    expect(new Set(meilleure.ordre)).toEqual(new Set(actuelle.ordre));
  });

  it("respecte les créneaux imposés par les clients", () => {
    const t = meilleureTournee(DOMICILE_ANA, etapes, 450);
    expect(t.respecteCreneaux).toBe(true);
    t.ordre.forEach((id, i) => {
      const e = etapes.find((x) => x.id === id)!;
      if (e.debutMin !== undefined) expect(t.debuts[i]).toBeGreaterThanOrEqual(e.debutMin);
      if (e.debutMax !== undefined) expect(t.debuts[i]).toBeLessThanOrEqual(e.debutMax);
    });
  });

  it("garde l'ordre actuel quand aucun ordre ne respecte les créneaux", () => {
    const impossible: Etape[] = [
      { id: "a", lat: 46.5, lon: 6.6, dureeMin: 300, debutMin: 480, debutMax: 480 },
      { id: "b", lat: 46.6, lon: 6.7, dureeMin: 60, debutMin: 500, debutMax: 510 },
    ];
    expect(meilleureTournee({ lat: 46.5, lon: 6.6 }, impossible, 470).ordre).toEqual(["a", "b"]);
  });

  it("refuse une recherche exhaustive au-delà de 8 étapes", () => {
    const trop = Array.from({ length: 9 }, (_, i) => ({ id: String(i), lat: 46.5, lon: 6.6, dureeMin: 30 }));
    expect(() => meilleureTournee({ lat: 46.5, lon: 6.6 }, trop, 480)).toThrow();
  });
});

describe("parrainage", () => {
  const f = { id: "k", parrainId: "A001", heuresTravaillees: 0, zoneEnManque: false };

  it("verse la prime en deux temps", () => {
    expect(primesDues({ ...f, etape: "candidature" }).total).toBe(0);
    expect(primesDues({ ...f, etape: "retenu" }).total).toBe(50);
    expect(primesDues({ ...f, etape: "actif", heuresTravaillees: 29 }).total).toBe(50);
    expect(primesDues({ ...f, etape: "actif", heuresTravaillees: 30 }).total).toBe(100);
  });

  it("augmente la prime à 75 + 75 CHF pour une zone en manque", () => {
    expect(primesDues({ ...f, etape: "retenu", zoneEnManque: true }).total).toBe(75);
    expect(primesDues({ ...f, etape: "actif", heuresTravaillees: 40, zoneEnManque: true }).total).toBe(150);
    expect(primesDues({ ...f, etape: "candidature", zoneEnManque: true }).aVenir).toBe(150);
  });

  it("ne promet rien pour une candidature refusée", () => {
    expect(primesDues({ ...f, etape: "refuse" })).toEqual({ retenue: 0, trenteHeures: 0, total: 0, aVenir: 0 });
  });

  it("empêche de parrainer deux fois la même personne", () => {
    expect(dejaParraine([{ email: "Rita.M@exemple.test " }], "rita.m@exemple.test")).toBe(true);
    expect(dejaParraine([{ email: "rita.m@exemple.test" }], "autre@exemple.test")).toBe(false);
  });

  it("produit un code lisible et stable", () => {
    expect(codeParrainage("Inês", "A012")).toBe("INES-012");
    expect(codeParrainage("Ana", "A001")).toBe("ANA-001");
  });
});

describe("notation et alertes", () => {
  it("alerte à 1 et 2 étoiles seulement", () => {
    expect([1, 2, 3, 4, 5].map(declencheAlerte)).toEqual([true, true, false, false, false]);
    expect(() => declencheAlerte(0)).toThrow();
    expect(() => declencheAlerte(2.5)).toThrow();
  });

  it("prévient le bureau et la personne notée, avec un SMS en plus à 1 étoile", () => {
    const deux = destinatairesAlerte("client-note-agent", 2);
    expect(deux.map((d) => d.role)).toEqual(["responsable-qualite", "coordinateur", "agent"]);
    const une = destinatairesAlerte("agent-note-client", 1);
    expect(une.some((d) => d.canal === "sms")).toBe(true);
    expect(une.at(-1)!.role).toBe("client");
    expect(destinatairesAlerte("client-note-agent", 4)).toEqual([]);
  });

  it("calcule moyenne et tendance", () => {
    expect(moyenne([])).toBeNull();
    expect(moyenne([{ etoiles: 5 }, { etoiles: 4 }])).toBe(4.5);
    const notes = [5, 5, 5, 5, 3, 3, 2].map((etoiles, i) => ({ etoiles, date: `2026-10-0${i + 1}` }));
    expect(enBaisse(notes)).toBe(true);
    expect(enBaisse(notes.slice(0, 4))).toBe(false);
  });
});

describe("remplacement", () => {
  const logement = { lat: 46.5108, lon: 6.6235 };
  const proche = { lat: 46.512, lon: 6.625 };
  const c = (id: string, extra: Partial<Candidat> = {}): Candidat => ({ id, position: proche, noteMoyenne: 4.5, fiabilite: 95, connaitLeClient: false, occupe: false, refuseParLeClient: false, ...extra });

  it("écarte les agents occupés, refusés par le client ou trop loin", () => {
    const res = classerRemplacants(logement, [
      c("occupe", { occupe: true }),
      c("refuse", { refuseParLeClient: true }),
      c("loin", { position: { lat: 46.2044, lon: 6.1432 } }),
      c("ok"),
    ]);
    expect(res.map((r) => r.id)).toEqual(["ok"]);
  });

  it("met en tête l'agent qui connaît déjà le client", () => {
    const res = classerRemplacants(logement, [c("inconnu", { noteMoyenne: 5, fiabilite: 100 }), c("connait", { connaitLeClient: true })]);
    expect(res[0].id).toBe("connait");
  });

  it("verse une prime d'urgence sous 24 heures seulement", () => {
    expect(primeUrgence(3, 1.5)).toBe(7.5);
    expect(primeUrgence(30, 1.5)).toBe(0);
  });
});

describe("données fictives", () => {
  it("sont reproductibles et cohérentes", () => {
    expect(AGENTS).toHaveLength(40);
    expect(CLIENTS).toHaveLength(60);
    expect(new Set(AGENTS.map((a) => a.id)).size).toBe(40);
    for (const c of CLIENTS) expect(AGENTS.some((a) => a.id === c.agentHabituel)).toBe(true);
  });

  it("font apparaître des zones en manque, triées de la moins couverte à la mieux couverte", () => {
    const zones = zonesEnManque();
    expect(zones.length).toBeGreaterThan(2);
    for (let i = 1; i < zones.length; i++) expect(tauxCouverture(zones[i])).toBeGreaterThanOrEqual(tauxCouverture(zones[i - 1]));
  });

  it("n'utilisent que des adresses e-mail en .test", () => {
    // garde-fou : aucune adresse réelle dans les données de démonstration
    const texte = JSON.stringify({ AGENTS, CLIENTS });
    expect(texte).not.toMatch(/@(?!exemple\.test)/);
  });
});

describe("mise en forme des nombres", () => {
  it("est identique partout, sans dépendre des données de langue de Node ou du navigateur", async () => {
    const { formaterNombre, formaterCHF } = await import("@/lib/i18n");
    expect(formaterNombre(2793, "fr")).toBe("2 793");
    expect(formaterNombre(5121, "en")).toBe("5,121");
    expect(formaterNombre(16.7, "fr", 1)).toBe("16,7");
    expect(formaterNombre(1234567.891, "en", 2)).toBe("1,234,567.89");
    expect(formaterNombre(-950, "fr")).toBe("-950");
    expect(formaterCHF(43.9, "fr")).toBe("CHF 43,90");
  });
});
