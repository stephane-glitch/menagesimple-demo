"use client";

// Page que reçoit la personne recommandée : une candidature en 3 minutes, sur téléphone.

import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { useT } from "@/lib/i18n";
import { AGENTS, COMMUNES, zonesEnManque } from "@/lib/donnees";
import { codeParrainage, dejaParraine } from "@/lib/regles/parrainage";
import { CANDIDATURES, type Candidature } from "@/lib/donnees/recrutement";
import { useIdentifiant, useSimulation } from "@/lib/simulation";
import { Bouton, Page } from "@/components/ui";

// Noms fixes : Intl.DisplayNames diffère entre le serveur et le navigateur.
const LANGUES: Record<string, [string, string]> = {
  fr: ["français", "French"], pt: ["portugais", "Portuguese"], es: ["espagnol", "Spanish"], it: ["italien", "Italian"],
  de: ["allemand", "German"], en: ["anglais", "English"], sq: ["albanais", "Albanian"], sr: ["serbe", "Serbian"],
  ti: ["tigrigna", "Tigrinya"], ar: ["arabe", "Arabic"],
};

function Formulaire() {
  const t = useT();
  const params = useSearchParams();
  const { etat, envoyer } = useSimulation();
  const id = useIdentifiant();
  const code = params.get("parrain") ?? "";
  const parrain = AGENTS.find((a) => codeParrainage(a.prenom, a.id) === code) ?? null;
  const [envoye, setEnvoye] = useState<Candidature | null>(null);
  const [doublon, setDoublon] = useState(false);
  const [f, setF] = useState({
    prenom: "", nom: "", email: "", commune: "Nyon", permis: "C" as Candidature["permis"], zones: ["Nyon"] as string[],
    horaires: "", taux: 50, experience: "", langues: ["fr"] as string[], references: 1, message: "",
  });
  const enManque = zonesEnManque().map((z) => z.commune);

  function soumettre(e: React.FormEvent) {
    e.preventDefault();
    if (dejaParraine([...etat.candidatures, ...CANDIDATURES], f.email)) {
      setDoublon(true);
      return;
    }
    const c: Candidature = {
      id: id("K"), prenom: f.prenom.trim(), initialeNom: `${f.nom.trim().charAt(0).toUpperCase()}.`, email: f.email.trim(),
      parrainId: parrain?.id ?? null, source: parrain ? "parrainage" : "annonce", commune: f.commune, permis: f.permis,
      zones: f.zones, horaires: f.horaires || "flexible", tauxSouhaite: f.taux, experience: f.experience || "—",
      langues: f.langues, references: f.references, message: f.message, etape: "candidature", heuresTravaillees: 0,
      zoneEnManque: f.zones.some((z) => enManque.includes(z)), date: new Date().toISOString().slice(0, 10),
    };
    envoyer({ type: "candidater", candidature: c });
    setEnvoye(c);
  }

  if (envoye) {
    return (
      <div className="arriver mx-auto max-w-[520px] py-16 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-ok" strokeWidth={1.6} />
        <h1 className="mt-4 text-[2rem] font-extrabold leading-tight">{t("Merci", "Thank you")} {envoye.prenom}</h1>
        <p className="mt-3 text-encre-2">{t("Votre candidature est arrivée chez MénageSimple. Une personne de l'équipe la lit et vous appelle si votre profil correspond.", "Your application has reached MénageSimple. Someone from the team will read it and call you if your profile fits.")}</p>
        <Link href="/recrutement/parrainage" className="mt-8 inline-block font-semibold text-sapin hover:underline">{t("Voir la candidature côté bureau", "See the application on the office side")}</Link>
      </div>
    );
  }

  const champ = "mt-1 w-full rounded-lg border border-trait bg-surface px-3 py-2.5";
  return (
    <form onSubmit={soumettre} className="mx-auto max-w-[560px] py-10 sm:py-14">
      <p className="text-sm font-semibold text-sapin">MénageSimple</p>
      <h1 className="mt-1 text-[2.1rem] font-extrabold leading-[1.05]">{t("Travailler dans le ménage", "Work in cleaning")}</h1>
      {parrain ? (
        <p className="mt-3 rounded-xl bg-citron px-4 py-3 text-sm">{t(`${parrain.prenom} vous recommande et travaille avec nous depuis ${Math.round(parrain.moisAnciennete / 12)} ans.`, `${parrain.prenom} recommends you and has worked with us for ${Math.round(parrain.moisAnciennete / 12)} years.`)}</p>
      ) : (
        <p className="mt-3 text-sm text-encre-2">{t("Candidature spontanée.", "Spontaneous application.")}</p>
      )}
      <p className="mt-4 text-encre-2">{t("Déclaré et assuré, produits fournis, vous choisissez vos horaires. 3 minutes pour postuler.", "Declared and insured, products supplied, you choose your hours. 3 minutes to apply.")}</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium">{t("Prénom", "First name")}<input required value={f.prenom} onChange={(e) => setF({ ...f, prenom: e.target.value })} className={champ} /></label>
        <label className="text-sm font-medium">{t("Nom", "Last name")}<input required value={f.nom} onChange={(e) => setF({ ...f, nom: e.target.value })} className={champ} /></label>
        <label className="text-sm font-medium sm:col-span-2">{t("E-mail ou téléphone", "Email or phone")}<input required value={f.email} onChange={(e) => { setF({ ...f, email: e.target.value }); setDoublon(false); }} className={champ} /></label>
        <label className="text-sm font-medium">{t("Vous habitez à", "You live in")}
          <select value={f.commune} onChange={(e) => setF({ ...f, commune: e.target.value })} className={champ}>{COMMUNES.map((c) => <option key={c.nom}>{c.nom}</option>)}</select>
        </label>
        <label className="text-sm font-medium">{t("Autorisation de travail", "Work permit")}
          <select value={f.permis} onChange={(e) => setF({ ...f, permis: e.target.value as Candidature["permis"] })} className={champ}>
            <option value="suisse">{t("Nationalité suisse", "Swiss citizen")}</option><option value="C">{t("Permis C", "C permit")}</option><option value="B">{t("Permis B", "B permit")}</option>
            <option value="G">{t("Permis G (frontalier)", "G permit (cross-border)")}</option><option value="aucun">{t("Pas encore", "Not yet")}</option>
          </select>
        </label>
      </div>

      <fieldset className="mt-5">
        <legend className="text-sm font-medium">{t("Où pouvez-vous travailler ?", "Where can you work?")}</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {COMMUNES.map((c) => {
            const actif = f.zones.includes(c.nom);
            return (
              <button type="button" key={c.nom} aria-pressed={actif} onClick={() => setF({ ...f, zones: actif ? f.zones.filter((z) => z !== c.nom) : [...f.zones, c.nom] })}
                className={`rounded-full border px-3 py-1.5 text-sm transition ${actif ? "border-sapin bg-sapin text-sur-sapin" : "border-trait bg-surface hover:border-trait-fort"}`}>
                {c.nom}{enManque.includes(c.nom) && <span className={actif ? "text-citron" : "text-alerte"}> ·</span>}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium">{t("Vos disponibilités", "Your availability")}<input placeholder={t("ex. mardi et jeudi matin", "e.g. Tuesday and Thursday mornings")} value={f.horaires} onChange={(e) => setF({ ...f, horaires: e.target.value })} className={champ} /></label>
        <label className="text-sm font-medium">{t("Taux souhaité :", "Desired workload:")} <span className="chiffres">{f.taux} %</span>
          <input type="range" min={10} max={100} step={10} value={f.taux} onChange={(e) => setF({ ...f, taux: Number(e.target.value) })} className="mt-3 w-full accent-[var(--sapin)]" />
        </label>
        <label className="text-sm font-medium sm:col-span-2">{t("Votre expérience du ménage", "Your cleaning experience")}<input value={f.experience} onChange={(e) => setF({ ...f, experience: e.target.value })} className={champ} /></label>
      </div>
      <fieldset className="mt-5">
        <legend className="text-sm font-medium">{t("Langues parlées", "Languages spoken")}</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {Object.entries(LANGUES).map(([l, [fr, en]]) => {
            const actif = f.langues.includes(l);
            const nom = t(fr, en);
            return (
              <button type="button" key={l} aria-pressed={actif} onClick={() => setF({ ...f, langues: actif ? f.langues.filter((x) => x !== l) : [...f.langues, l] })}
                className={`rounded-full border px-3 py-1.5 text-sm ${actif ? "border-sapin bg-sapin text-sur-sapin" : "border-trait bg-surface"}`}>{nom}</button>
            );
          })}
        </div>
      </fieldset>
      <label className="mt-5 block text-sm font-medium">{t("Un mot pour l'équipe (facultatif)", "A note for the team (optional)")}<textarea rows={3} value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} className={champ} /></label>
      {doublon && <p className="mt-4 rounded-lg bg-attention-fond px-3 py-2 text-sm text-attention">{t("Une candidature existe déjà avec cette adresse.", "An application already exists with this address.")}</p>}
      <Bouton type="submit" className="mt-6 w-full">{t("Envoyer ma candidature", "Send my application")}</Bouton>
      <p className="mt-3 text-xs text-encre-3">{t("Démonstration : la candidature reste dans votre navigateur.", "Demo: the application stays in your browser.")}</p>
    </form>
  );
}

export default function Rejoindre() {
  return (
    <Page>
      <Suspense fallback={<div className="h-96" />}>
        <Formulaire />
      </Suspense>
    </Page>
  );
}
