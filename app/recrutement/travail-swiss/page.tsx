"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ExternalLink, Loader2, Mail, Search } from "lucide-react";
import { formaterNombre, useLangue, useT } from "@/lib/i18n";
import { CANTONS_ROMANDS, METIERS, type Canton, type Criteres, type Disponibilite, type Experience, type ProfilAnonyme } from "@/lib/jobroom";
import { COMMUNES } from "@/lib/donnees";
import { appelerIA, Bouton, Pastille } from "@/components/ui";
import { Brouillon } from "@/components/brouillon";
import { Fenetre } from "@/components/fenetre";

type Resultat = { total: number; profils: ProfilAnonyme[]; libelles: Record<string, string | null>; horodatage: string };
type Classement = { selection: { id: string; raison: string }[]; synthese: string };
type Creneau = "matin" | "apres-midi" | "soir" | "indifferent";

const EXPERIENCE: Record<string, [string, string]> = {
  LESS_THAN_1_YEAR: ["moins d'un an", "under 1 year"],
  MORE_THAN_1_YEAR: ["plus d'un an", "1+ year"],
  MORE_THAN_3_YEARS: ["plus de 3 ans", "3+ years"],
};
const NIVEAU: Record<string, [string, string]> = {
  PROFICIENT: ["courant", "fluent"], INTERMEDIATE: ["intermédiaire", "intermediate"], BASIC: ["notions", "basic"],
};
const NOMS_CANTONS: Record<string, [string, string]> = {
  VD: ["Vaud", "Vaud"], GE: ["Genève", "Geneva"], VS: ["Valais", "Valais"], FR: ["Fribourg", "Fribourg"], NE: ["Neuchâtel", "Neuchâtel"], JU: ["Jura", "Jura"],
};
const LANGUES: Record<string, [string, string]> = {
  fr: ["français", "French"], en: ["anglais", "English"], de: ["allemand", "German"], it: ["italien", "Italian"], pt: ["portugais", "Portuguese"],
  es: ["espagnol", "Spanish"], sq: ["albanais", "Albanian"], sr: ["serbe", "Serbian"], ar: ["arabe", "Arabic"], ti: ["tigrigna", "Tigrinya"],
  tr: ["turc", "Turkish"], ru: ["russe", "Russian"], uk: ["ukrainien", "Ukrainian"], fa: ["persan", "Persian"], mk: ["macédonien", "Macedonian"],
  hr: ["croate", "Croatian"], bs: ["bosniaque", "Bosnian"], ro: ["roumain", "Romanian"], pl: ["polonais", "Polish"], ta: ["tamoul", "Tamil"],
};

function Choix<T extends string>({ legende, valeur, options, onChange }: { legende: string; valeur: T; options: { v: T; l: string }[]; onChange: (v: T) => void }) {
  return (
    <fieldset>
      <legend className="text-xs font-semibold text-encre-2">{legende}</legend>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {options.map((o) => (
          <button key={o.v} type="button" aria-pressed={valeur === o.v} onClick={() => onChange(o.v)}
            className={`rounded-full border px-3 py-1.5 text-sm transition ${valeur === o.v ? "border-sapin bg-sapin text-sur-sapin" : "border-trait bg-fond hover:border-trait-fort"}`}>
            {o.l}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function Recherche() {
  const t = useT();
  const { langue } = useLangue();
  const params = useSearchParams();
  const commune = params.get("commune");
  const cantonDepart = (COMMUNES.find((c) => c.nom === commune)?.canton ?? "VD") as Canton;

  const [canton, setCanton] = useState<Canton>(cantonDepart);
  const [creneau, setCreneau] = useState<Creneau>("matin");
  const [jours, setJours] = useState(2);
  const [tauxMin, setTauxMin] = useState(30);
  const [tauxMax, setTauxMax] = useState(60);
  const [francais, setFrancais] = useState(true);
  const [anglais, setAnglais] = useState(false);
  const [experience, setExperience] = useState<Experience>("MORE_THAN_1_YEAR");
  const [disponibilite, setDisponibilite] = useState<Disponibilite>("IMMEDIATE");

  const [chargement, setChargement] = useState<"recherche" | "message" | null>(null);
  const [resultat, setResultat] = useState<Resultat | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [classement, setClassement] = useState<Classement | null>(null);
  const [choisis, setChoisis] = useState<string[]>([]);
  const [message, setMessage] = useState<{ objet: string; corps: string; source: "ia" | "regles"; erreur?: string } | null>(null);
  const [fenetre, setFenetre] = useState(false);
  const [romandie, setRomandie] = useState<{ direct: boolean; parCanton: Record<string, { total: number; immediat: number }> } | null>(null);

  useEffect(() => {
    let actif = true;
    fetch("/api/jobroom/romandie").then((r) => r.json()).then((d) => { if (actif) setRomandie(d); }).catch(() => {});
    return () => { actif = false; };
  }, []);

  const criteres: Criteres = { canton, disponibilite, tauxMin, tauxMax: Math.max(tauxMin, tauxMax), langues: [...(francais ? ["fr" as const] : []), ...(anglais ? ["en" as const] : [])], experience };
  const libelleCreneau = { matin: t("le matin", "mornings"), "apres-midi": t("l'après-midi", "afternoons"), soir: t("le soir", "evenings"), indifferent: t("à n'importe quel moment de la journée", "at any time of day") }[creneau];
  const libelleJours = t(`${jours} jour${jours > 1 ? "s" : ""} par semaine`, `${jours} day${jours > 1 ? "s" : ""} a week`);

  async function lancer() {
    setChargement("recherche"); setErreur(null); setClassement(null); setMessage(null); setChoisis([]);
    try {
      const r = await fetch("/api/jobroom", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(criteres) });
      if (!r.ok) throw new Error();
      const d = (await r.json()) as Resultat;
      setResultat(d);
      if (d.profils.length) {
        const besoin = `${commune ? `Zone de ${commune}. ` : ""}Agents de ménage chez des particuliers, ${libelleCreneau}, ${libelleJours}, ${criteres.tauxMin} à ${criteres.tauxMax} %.`;
        const c = await appelerIA<Classement>({ action: "classement", besoin, criteres, profils: d.profils, langue });
        setClassement(c.donnees);
        setChoisis(c.donnees.selection.slice(0, 3).map((s) => s.id));
      }
    } catch {
      setErreur(t("travail.swiss ne répond pas pour le moment. Réessayez dans un instant.", "travail.swiss isn't responding right now. Try again in a moment."));
    } finally {
      setChargement(null);
    }
  }

  async function preparerMessage() {
    if (!resultat) return;
    setChargement("message");
    try {
      const liens = resultat.profils.filter((p) => choisis.includes(p.id)).map((p) => p.lien);
      const r = await appelerIA<{ objet: string; corps: string }>({
        action: "message-orp", commune: commune ?? NOMS_CANTONS[canton][0], creneau: { matin: "le matin", "apres-midi": "l'après-midi", soir: "le soir", indifferent: "horaires à convenir" }[creneau],
        jours: `${jours} jour${jours > 1 ? "s" : ""} par semaine`, taux: `${criteres.tauxMin} à ${criteres.tauxMax} %`, liens,
      });
      setMessage({ ...r.donnees, source: r.source, erreur: r.erreur });
      setFenetre(true);
    } finally {
      setChargement(null);
    }
  }

  const ordre = useMemo(() => {
    if (!resultat) return [];
    const rang = new Map(classement?.selection.map((s, i) => [s.id, i]) ?? []);
    return [...resultat.profils].sort((a, b) => (rang.get(a.id) ?? 99) - (rang.get(b.id) ?? 99));
  }, [resultat, classement]);
  const raisons = new Map(classement?.selection.map((s) => [s.id, s.raison]) ?? []);
  const enDirect = romandie?.parCanton[canton];
  const taux = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
  const champ = "mt-1.5 w-full rounded-lg border border-trait bg-fond px-3 py-2 text-sm";

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
      <section className="h-fit rounded-2xl border border-trait bg-surface p-5 sm:p-6 lg:sticky lg:top-24">
        <h2 className="text-lg font-bold">{t("Qui cherchez-vous ?", "Who are you looking for?")}</h2>
        {commune && <p className="mt-1 text-sm text-encre-2">{t(`Pour la zone de ${commune}.`, `For the ${commune} area.`)}</p>}
        <div className="mt-5 space-y-4">
          <label className="block text-xs font-semibold text-encre-2">
            {t("Canton de domicile", "Canton of residence")}
            <select value={canton} onChange={(e) => setCanton(e.target.value as Canton)} className={champ}>
              {CANTONS_ROMANDS.map((c) => <option key={c} value={c}>{t(NOMS_CANTONS[c][0], NOMS_CANTONS[c][1])}</option>)}
            </select>
          </label>
          <Choix legende={t("Créneau", "Time of day")} valeur={creneau} onChange={setCreneau}
            options={[{ v: "matin", l: t("Matin", "Morning") }, { v: "apres-midi", l: t("Après-midi", "Afternoon") }, { v: "soir", l: t("Soir", "Evening") }, { v: "indifferent", l: t("Indifférent", "Any") }]} />
          <Choix legende={t("Jours par semaine", "Days a week")} valeur={String(jours)} onChange={(v) => setJours(Number(v))}
            options={[1, 2, 3, 4, 5].map((n) => ({ v: String(n), l: String(n) }))} />
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-xs font-semibold text-encre-2">{t("Taux de", "Workload from")}
              <select value={tauxMin} onChange={(e) => setTauxMin(Number(e.target.value))} className={champ}>{taux.map((n) => <option key={n} value={n}>{n} %</option>)}</select>
            </label>
            <label className="block text-xs font-semibold text-encre-2">{t("à", "to")}
              <select value={tauxMax} onChange={(e) => setTauxMax(Number(e.target.value))} className={champ}>{taux.filter((n) => n >= tauxMin).map((n) => <option key={n} value={n}>{n} %</option>)}</select>
            </label>
          </div>
          <fieldset>
            <legend className="text-xs font-semibold text-encre-2">{t("Langues parlées", "Languages spoken")}</legend>
            <div className="mt-1.5 flex flex-wrap gap-x-5 gap-y-2 text-sm">
              <label className="flex items-center gap-2"><input type="checkbox" className="h-4 w-4 accent-[var(--sapin)]" checked={francais} onChange={(e) => setFrancais(e.target.checked)} />{t("Parle français", "Speaks French")}</label>
              <label className="flex items-center gap-2"><input type="checkbox" className="h-4 w-4 accent-[var(--sapin)]" checked={anglais} onChange={(e) => setAnglais(e.target.checked)} />{t("Parle anglais", "Speaks English")}</label>
            </div>
          </fieldset>
          <Choix legende={t("Expérience dans le nettoyage", "Cleaning experience")} valeur={experience} onChange={setExperience}
            options={[{ v: "TOUTE", l: t("Peu importe", "Any") }, { v: "MORE_THAN_1_YEAR", l: t("Plus d'un an", "1+ year") }, { v: "MORE_THAN_3_YEARS", l: t("Plus de 3 ans", "3+ years") }]} />
          <Choix legende={t("Disponibilité", "Availability")} valeur={disponibilite} onChange={setDisponibilite}
            options={[{ v: "IMMEDIATE", l: t("Tout de suite", "Now") }, { v: "BY_ARRANGEMENT", l: t("À convenir", "To agree") }, { v: "TOUTES", l: t("Peu importe", "Any") }]} />
        </div>
        <Bouton onClick={lancer} disabled={chargement !== null} className="mt-6 min-h-12 w-full">
          {chargement === "recherche" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          {t("Lancer la recherche", "Run the search")}
        </Bouton>
        <p className="mt-3 text-xs text-encre-3">
          {t("Recherche réelle sur travail.swiss, dans les métiers du nettoyage. Seuls des champs anonymes sont lus ; rien n'est enregistré.",
            "Real search on travail.swiss, in cleaning occupations. Only anonymous fields are read; nothing is stored.")}
        </p>
      </section>

      <div className="min-w-0">
        {!resultat && !erreur && (
          <div className="rounded-2xl border border-dashed border-trait-fort p-8">
            {enDirect ? (
              <p className="max-w-[46ch] text-lg">
                {t("En ce moment sur travail.swiss, ", "Right now on travail.swiss, ")}
                <span className="chiffres font-bold">{formaterNombre(enDirect.total, langue)}</span>
                {t(` personnes du nettoyage sont inscrites dans le canton (${NOMS_CANTONS[canton][0]}), dont `, ` cleaning workers are registered in the canton (${NOMS_CANTONS[canton][1]}), `)}
                <span className="chiffres font-bold text-sapin">{formaterNombre(enDirect.immediat, langue)}</span>
                {t(" disponibles tout de suite.", " available now.")}
              </p>
            ) : (
              <p className="text-encre-2">{t("Choisissez vos critères puis lancez la recherche.", "Pick your criteria, then run the search.")}</p>
            )}
            <p className="mt-3 text-sm text-encre-2">{t("Les profils s'afficheront ici, chacun avec un lien vers sa fiche officielle.", "Profiles will appear here, each with a link to its official page.")}</p>
          </div>
        )}
        {erreur && <p className="rounded-xl bg-alerte-fond p-4 text-sm text-alerte">{erreur}</p>}
        {resultat && (
          <section className="arriver">
            <div className="flex flex-wrap items-end justify-between gap-3 border-b border-trait pb-4">
              <div>
                <p className="text-[2rem] font-extrabold leading-tight"><span className="chiffres">{formaterNombre(resultat.total, langue)}</span> {t("profils", "profiles")}</p>
                <p className="text-sm text-encre-2">
                  {t(`Inscrits sur travail.swiss, ${NOMS_CANTONS[canton][0]}, ${criteres.tauxMin} à ${criteres.tauxMax} %. Les 20 premiers, les plus adaptés en tête.`,
                    `Registered on travail.swiss, ${NOMS_CANTONS[canton][1]}, ${criteres.tauxMin} to ${criteres.tauxMax}%. First 20, best matches first.`)}
                </p>
              </div>
            </div>
            {resultat.profils.length === 0 && <p className="mt-6 text-encre-2">{t("Aucun profil avec ces critères. Élargissez le taux ou la disponibilité.", "No profile matches. Widen the workload or availability.")}</p>}
            <ul className="mt-4 space-y-2.5">
              {ordre.map((p) => {
                const raison = raisons.get(p.id);
                const coche = choisis.includes(p.id);
                const nomMetier = METIERS.find((m) => Number(m.code.value) === p.metierCode)?.libelle[langue] ?? resultat.libelles[`${p.metierCodeType}-${p.metierCode}`] ?? t("Métier non précisé", "Occupation not stated");
                return (
                  <li key={p.id} className={`rounded-xl border bg-surface p-4 transition ${coche ? "border-sapin" : "border-trait"}`}>
                    <div className="flex items-start gap-3">
                      <input type="checkbox" aria-label={t("Retenir ce profil pour le message", "Keep this profile for the message")} className="mt-1.5 h-4 w-4 accent-[var(--sapin)]" checked={coche}
                        onChange={(e) => setChoisis(e.target.checked ? [...choisis, p.id] : choisis.filter((x) => x !== p.id))} />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold">{nomMetier}</p>
                          {raison && <Pastille ton="sapin">{t("Retenu", "Shortlisted")} #{classement!.selection.findIndex((s) => s.id === p.id) + 1}</Pastille>}
                        </div>
                        <p className="mt-1 text-sm text-encre-2">
                          {[
                            p.canton && `${t("Domicile", "Lives in")} ${p.canton}`,
                            p.disponibilite === "IMMEDIATE" ? t("disponible tout de suite", "available now") : t("disponibilité à convenir", "availability to agree"),
                            p.taux !== null && `${p.taux} %`,
                            p.experience && `${t("expérience", "experience")} ${EXPERIENCE[p.experience]?.[langue === "fr" ? 0 : 1] ?? p.experience}`,
                          ].filter(Boolean).join(" · ")}
                        </p>
                        {p.langues.length > 0 && (
                          <p className="mt-1 text-xs text-encre-3">{p.langues.slice(0, 4).map((l) => `${LANGUES[l.code]?.[langue === "fr" ? 0 : 1] ?? l.code}${NIVEAU[l.oral] ? ` (${NIVEAU[l.oral][langue === "fr" ? 0 : 1]})` : ""}`).join(", ")}</p>
                        )}
                        {raison && <p className="mt-2 text-sm text-sapin">{raison}</p>}
                      </div>
                      <a href={p.lien} target="_blank" rel="noreferrer" className="inline-flex shrink-0 items-center gap-1 rounded-full border border-trait px-3 py-1.5 text-xs font-semibold text-sapin hover:border-sapin">
                        {t("Fiche", "Profile")} <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </li>
                );
              })}
            </ul>
            {resultat.profils.length > 0 && (
              <div className="sticky bottom-3 mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-trait bg-surface/95 p-3 shadow-[0_10px_30px_-12px_rgba(23,21,43,0.3)]">
                <p className="text-sm text-encre-2">{choisis.length} {t("profil(s) retenu(s)", "profile(s) selected")}</p>
                <Bouton onClick={preparerMessage} disabled={choisis.length === 0 || chargement !== null}>
                  {chargement === "message" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                  {t("Préparer le message à l'ORP", "Draft the job-centre message")}
                </Bouton>
              </div>
            )}
          </section>
        )}
      </div>

      <Fenetre titre={t("Message à la conseillère ou au conseiller ORP", "Message to the job-centre adviser")} ouverte={fenetre && !!message} onFermer={() => setFenetre(false)} large>
        {message && (
          <>
            <Brouillon
              key={message.corps}
              titre={t("À relire avant l'envoi", "Review before sending")}
              destinataire={t("Conseillère ou conseiller ORP indiqué sur chaque fiche travail.swiss", "Job-centre adviser named on each travail.swiss profile")}
              canal="email"
              objetInitial={message.objet}
              corpsInitial={message.corps}
              source={message.source}
              erreur={message.erreur}
            />
            <p className="mt-3 text-xs text-encre-3">{t("Le message reste en français : les ORP romands travaillent en français.", "The message stays in French: French-speaking job centres work in French.")}</p>
          </>
        )}
      </Fenetre>
    </div>
  );
}

export default function PageTravailSwiss() {
  return (
    <Suspense fallback={<div className="h-96" />}>
      <Recherche />
    </Suspense>
  );
}
