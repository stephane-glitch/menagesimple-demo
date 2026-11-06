"use client";

import { useState } from "react";
import { Car, Check, Clock, House, Sparkles, TrainFront, TriangleAlert } from "lucide-react";
import { formaterNombre, useLangue, useT } from "@/lib/i18n";
import { PLANNINGS } from "@/lib/donnees/plannings";
import { MARGE_CONFORT_MIN, verifierJournee, type EtapeVerifiee } from "@/lib/regles/planning";
import { Pastille } from "@/components/ui";

const DEBUT_AXE = 7 * 60;
const FIN_AXE = 19 * 60;

const hh = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
const duree = (m: number) => (m >= 60 ? `${Math.floor(m / 60)} h ${m % 60 ? String(m % 60).padStart(2, "0") : ""}`.trim() : `${m} min`);
const pct = (m: number) => `${((Math.min(Math.max(m, DEBUT_AXE), FIN_AXE) - DEBUT_AXE) / (FIN_AXE - DEBUT_AXE)) * 100}%`;

function journeeDe(id: string) {
  const p = PLANNINGS.find((x) => x.id === id)!;
  return { personne: p, j: verifierJournee(p.domicile, p.passages.map((x) => ({ id: x.id, debut: x.debut, duree: x.duree, ...x.position }))) };
}

function Verdict({ tient, serres }: { tient: boolean; serres: number }) {
  const t = useT();
  if (!tient) return <Pastille ton="alerte"><TriangleAlert className="h-3.5 w-3.5" />{t("ne tient pas", "doesn't work")}</Pastille>;
  if (serres) return <Pastille ton="attention">{t("tient, de justesse", "works, just")}</Pastille>;
  return <Pastille ton="ok"><Check className="h-3.5 w-3.5" />{t("tient", "works")}</Pastille>;
}

export default function Planning() {
  const t = useT();
  const { langue } = useLangue();
  const [id, setId] = useState(PLANNINGS[0].id);
  const { personne, j } = journeeDe(id);
  const debutJournee = j.etapes[0].depart;
  const finJournee = j.etapes.at(-1)!.fin;
  const passage = (e: EtapeVerifiee) => personne.passages.find((p) => p.id === e.id)!;
  const Transport = personne.transport.fr === "voiture" ? Car : TrainFront;

  return (
    <div className="space-y-6">
      <div role="radiogroup" aria-label={t("Personne", "Person")} className="grid gap-3 sm:grid-cols-3">
        {PLANNINGS.map((p) => {
          const { j: jp } = journeeDe(p.id);
          const actif = p.id === id;
          return (
            <button key={p.id} type="button" role="radio" aria-checked={actif} onClick={() => setId(p.id)}
              className={`flex items-center justify-between gap-3 rounded-2xl border bg-surface p-4 text-left transition ${actif ? "border-sapin ring-2 ring-sapin/20" : "border-trait hover:border-trait-fort"}`}>
              <span className="min-w-0">
                <span className="block font-bold">{p.prenom} {p.nom}</span>
                <span className="text-xs text-encre-3">{p.commune} · {p.passages.length} {t("passages", "visits")}</span>
              </span>
              <Verdict tient={jp.tient} serres={jp.serres} />
            </button>
          );
        })}
      </div>

      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { ic: Sparkles, l: t("Ménage sur place", "Cleaning on site"), v: duree(j.minutesMenage) },
          { ic: Transport, l: t(`Trajets (${personne.transport.fr})`, `Travel (${personne.transport.en})`), v: `${duree(j.minutesTrajet)} · ${formaterNombre(j.km, langue, 1)} km` },
          { ic: Clock, l: t("Journée", "Day"), v: `${hh(debutJournee)} – ${hh(finJournee)}` },
          { ic: House, l: t("Part du trajet", "Share spent travelling"), v: `${Math.round((j.minutesTrajet / (j.minutesTrajet + j.minutesMenage)) * 100)} %` },
        ].map(({ ic: Icone, l, v }) => (
          <div key={l} className="rounded-2xl border border-trait bg-surface p-4">
            <dt className="flex items-center gap-1.5 text-xs font-semibold text-encre-3"><Icone className="h-3.5 w-3.5" />{l}</dt>
            <dd className="chiffres mt-1 text-xl font-extrabold">{v}</dd>
          </div>
        ))}
      </dl>

      <section className="rounded-2xl border border-trait bg-surface p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-bold">{t("La journée en un coup d'œil", "The day at a glance")}</h2>
          <div className="flex flex-wrap gap-3 text-xs text-encre-2">
            <span className="flex items-center gap-1.5"><span className="h-3 w-5 rounded bg-sapin" />{t("ménage", "cleaning")}</span>
            <span className="flex items-center gap-1.5"><span className="h-3 w-5 rounded bg-trait-fort" />{t("trajet", "travel")}</span>
            <span className="flex items-center gap-1.5"><span className="hachures h-3 w-5 rounded" />{t("marge avant l'heure du client", "margin before the client's time")}</span>
            <span className="flex items-center gap-1.5"><span className="h-3 w-5 rounded bg-alerte" />{t("retard", "late")}</span>
          </div>
        </div>
        <div className="relative mt-6 h-12">
          {Array.from({ length: (FIN_AXE - DEBUT_AXE) / 60 + 1 }, (_, i) => DEBUT_AXE + i * 60).map((m) => (
            <span key={m} className="absolute inset-y-0 border-l border-trait" style={{ left: pct(m) }}>
              <span className="chiffres absolute -top-5 -translate-x-1/2 text-[11px] text-encre-3">{m / 60}h</span>
            </span>
          ))}
          {j.etapes.map((e) => {
            const finTrajet = Math.min(e.arrivee, e.debut);
            return (
              <div key={e.id}>
                {/* Trajet collé au passage : la partie hachurée est la marge avant l'heure du client. */}
                <span className="absolute top-3 h-6 rounded-l bg-trait-fort" style={{ left: pct(e.depart), width: `calc(${pct(finTrajet)} - ${pct(e.depart)})` }} title={`${t("trajet", "travel")} ${e.trajetMin} min`} />
                {e.marge > 0 && <span className="hachures absolute top-3 h-6" style={{ left: pct(e.arrivee), width: `calc(${pct(e.debut)} - ${pct(e.arrivee)})` }} title={`${t("marge", "margin")} ${e.marge} min`} />}
                <span className="absolute top-1 grid h-10 place-items-center overflow-hidden rounded bg-sapin px-1 text-[11px] font-semibold text-sur-sapin" style={{ left: pct(e.debut), width: `calc(${pct(e.fin)} - ${pct(e.debut)})` }}>
                  <span className="truncate">{passage(e).client}</span>
                </span>
                {/* Retard : il mord sur le début du ménage, qui finit d'autant plus tard. */}
                {e.marge < 0 && <span className="absolute top-1 h-10 rounded-l bg-alerte" style={{ left: pct(e.debut), width: `calc(${pct(e.arrivee)} - ${pct(e.debut)})` }} title={`${t("retard", "late")} ${-e.marge} min`} />}
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-trait bg-surface">
        <h2 className="px-5 pt-5 font-bold">{t("Passage par passage", "Visit by visit")}</h2>
        <p className="px-5 text-sm text-encre-2">
          {t(`Les heures des clients sont fixes. On veut au moins ${MARGE_CONFORT_MIN} minutes de marge pour trouver l'entrée et les clés.`,
            `Clients' times are fixed. We want at least ${MARGE_CONFORT_MIN} minutes' margin to find the entrance and the keys.`)}
        </p>
        <ol className="mt-3 divide-y divide-trait">
          {j.etapes.map((e, i) => {
            const p = passage(e);
            return (
              <li key={e.id} className="grid gap-3 px-5 py-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_auto] sm:items-center">
                <div className="flex items-center gap-2 text-sm text-encre-2">
                  <Transport className="h-4 w-4 shrink-0 text-encre-3" />
                  <span>
                    {i === 0 ? t("Depuis chez soi", "From home") : t(`Depuis ${personne.passages.find((x) => x.id === j.etapes[i - 1].id)!.commune}`, `From ${personne.passages.find((x) => x.id === j.etapes[i - 1].id)!.commune}`)}
                    {" · "}<span className="chiffres">{e.trajetMin} min</span>
                    <span className="block text-xs text-encre-3">{t("départ", "leave")} <span className="chiffres">{hh(e.depart)}</span> · {t("arrivée", "arrive")} <span className="chiffres">{hh(e.arrivee)}</span></span>
                  </span>
                </div>
                <div>
                  <p className="font-semibold"><span className="chiffres">{hh(e.debut)}</span> · {p.client}</p>
                  <p className="text-xs text-encre-3">{p.adresse}, {p.commune} · {t("ménage", "cleaning")} {duree(p.duree)}</p>
                </div>
                <div className="sm:text-right">
                  {e.etat === "retard"
                    ? <Pastille ton="alerte">{t(`${-e.marge} min de retard`, `${-e.marge} min late`)}</Pastille>
                    : e.etat === "juste"
                      ? <Pastille ton="attention">{t(`${e.marge} min de marge`, `${e.marge} min margin`)}</Pastille>
                      : <Pastille ton="ok">{t(`${e.marge} min de marge`, `${e.marge} min margin`)}</Pastille>}
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      <section className={`rounded-2xl p-5 text-sm ${j.tient ? (j.serres ? "bg-attention-fond text-attention" : "bg-ok-fond text-ok") : "bg-alerte-fond text-alerte"}`}>
        <p className="font-bold">
          {!j.tient
            ? t(`La journée de ${personne.prenom} ne tient pas`, `${personne.prenom}'s day doesn't work`)
            : j.serres
              ? t(`La journée de ${personne.prenom} tient, mais un enchaînement est serré`, `${personne.prenom}'s day works, but one connection is tight`)
              : t(`La journée de ${personne.prenom} tient`, `${personne.prenom}'s day works`)}
        </p>
        <p className="mt-1 text-encre-2">
          {!j.tient
            ? t("Le premier retard se reporte sur tous les passages suivants. Avant de confirmer, le bureau donne un passage à une personne plus proche, ou demande au client un quart d'heure de souplesse.",
              "The first delay carries over to every following visit. Before confirming, the office gives a visit to someone closer, or asks the client for fifteen minutes' leeway.")
            : j.serres
              ? t("Au moindre retard de bus, le client attend. À surveiller, ou à décaler de quelques minutes.", "One late bus and the client waits. Keep an eye on it, or shift it by a few minutes.")
              : t("Aucun enchaînement trop court. Le planning peut être confirmé.", "No connection is too short. The schedule can be confirmed.")}
        </p>
      </section>

      <p className="text-xs text-encre-3">
        {t("Trajets estimés à vol d'oiseau × 1,35 (détours), à 22 km/h de moyenne en ville. Démonstration avec des plannings fictifs du mardi 10 novembre.",
          "Travel estimated as the crow flies × 1.35 (detours), at an average 22 km/h in town. Demo with fictional schedules for Tuesday 10 November.")}
      </p>
    </div>
  );
}
