"use client";

import { useState } from "react";
import { ArrowLeft, BookOpen, Lightbulb, Search, TriangleAlert } from "lucide-react";
import { useLangue, useT } from "@/lib/i18n";
import { agent } from "@/lib/donnees";
import { CONSEILS, MODULES, type FicheConseil, type Module } from "@/lib/donnees/formation";
import { NOTES_HISTORIQUE } from "@/lib/donnees/qualite";
import { enBaisse, moyenne } from "@/lib/regles/notation";
import { useSimulation } from "@/lib/simulation";
import { Etoiles } from "@/components/ui";

/** Sujet utile d'après les mots des commentaires clients. */
function sujetConseille(commentaires: string[]) {
  const texte = commentaires.join(" ").toLowerCase();
  if (/salle de bain|douche|calcaire|robinet|wc/.test(texte)) return MODULES.find((m) => m.id === "calcaire")!;
  if (/parquet|sol|marbre|inox|plaque/.test(texte)) return MODULES.find((m) => m.id === "materiaux")!;
  if (/cass|discr|photo|clé/.test(texte)) return MODULES.find((m) => m.id === "discretion")!;
  return MODULES.find((m) => m.id === "methode")!;
}

const sansAccent = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

type Ouvert = { genre: "fiche"; fiche: FicheConseil } | { genre: "sujet"; sujet: Module };

export default function ConnaissanceMetier() {
  const t = useT();
  const { langue } = useLangue();
  const { etat } = useSimulation();
  const [recherche, setRecherche] = useState("");
  const [ouvert, setOuvert] = useState<Ouvert | null>(null);
  const enLien = "materiaux"; // une cliente d'Ana a signalé un parquet lavé trop mouillé (fictif)

  const q = sansAccent(recherche.trim());
  const fiches = CONSEILS.filter((f) => !q || sansAccent([f.titre[langue], ...f.motsCles, ...f.etapes.map((e) => e[langue])].join(" ")).includes(q));
  const sujets = MODULES.filter((m) => !q || sansAccent([m.titre[langue], ...m.points.map((p) => p[langue])].join(" ")).includes(q));

  // Côté bureau : agents dont les notes baissent, et sujet à leur envoyer.
  const notesParAgent = new Map<string, typeof NOTES_HISTORIQUE>();
  for (const n of [...NOTES_HISTORIQUE, ...etat.notes].filter((x) => x.sens === "client-note-agent")) {
    notesParAgent.set(n.cibleId, [...(notesParAgent.get(n.cibleId) ?? []), n]);
  }
  const enDifficulte = [...notesParAgent.entries()].filter(([, ns]) => enBaisse(ns) || (moyenne(ns) ?? 5) < 3.5);

  return (
    <div className="grid gap-10 lg:grid-cols-[380px_minmax(0,1fr)]">
      <div className="telephone mx-auto w-full max-w-[380px] self-start rounded-[2.2rem] border-[10px] border-encre bg-fond p-4 shadow-[0_30px_60px_-30px_rgba(23,21,43,0.6)]">
        <p className="text-center text-xs text-encre-3">{t("Application de l'agent", "Cleaner's app")}</p>
        {!ouvert ? (
          <>
            <h3 className="mt-3 text-xl font-extrabold">{t("Connaissance métier", "Trade knowledge")}</h3>
            <p className="text-sm text-encre-2">{t("Les bons gestes, à consulter quand on en a besoin.", "The right techniques, to look up when you need them.")}</p>
            <label className="mt-4 flex items-center gap-2 rounded-xl border border-trait bg-surface px-3 py-2.5 focus-within:border-sapin">
              <Search className="h-4 w-4 shrink-0 text-encre-3" />
              <span className="sr-only">{t("Chercher", "Search")}</span>
              <input value={recherche} onChange={(e) => setRecherche(e.target.value)} placeholder={t("calcaire, parquet, four…", "limescale, parquet, oven…")}
                className="w-full bg-transparent text-sm outline-none" />
            </label>

            <p className="mt-5 text-xs font-semibold text-encre-2">{t("Fiches pratiques", "How-to sheets")}</p>
            <ul className="mt-2 space-y-1.5">
              {fiches.map((f) => (
                <li key={f.titre.fr}>
                  <button type="button" onClick={() => setOuvert({ genre: "fiche", fiche: f })}
                    className="flex w-full items-center gap-2.5 rounded-xl border border-trait bg-surface px-3 py-2.5 text-left text-sm font-semibold transition hover:border-trait-fort">
                    <Lightbulb className="h-4 w-4 shrink-0 text-sapin" />{f.titre[langue]}
                  </button>
                </li>
              ))}
            </ul>

            <p className="mt-5 text-xs font-semibold text-encre-2">{t("Les bons réflexes", "Good habits")}</p>
            <ul className="mt-2 space-y-1.5">
              {sujets.map((m) => (
                <li key={m.id}>
                  <button type="button" onClick={() => setOuvert({ genre: "sujet", sujet: m })}
                    className={`flex w-full items-center gap-2.5 rounded-xl border bg-surface px-3 py-2.5 text-left text-sm font-semibold transition hover:border-trait-fort ${m.id === enLien ? "border-citron-fonce ring-2 ring-citron" : "border-trait"}`}>
                    <BookOpen className="h-4 w-4 shrink-0 text-sapin" />
                    <span className="flex-1">{m.titre[langue]}</span>
                    {m.id === enLien && <span className="text-xs font-normal text-encre-2">{t("en lien avec un retour client", "linked to a client comment")}</span>}
                  </button>
                </li>
              ))}
            </ul>
            {fiches.length + sujets.length === 0 && (
              <p className="mt-3 text-sm text-encre-2">{t("Rien sur ce sujet. Posez la question à l'assistant ménage.", "Nothing on this. Ask the cleaning assistant.")}</p>
            )}
          </>
        ) : (
          <div className="mt-2">
            <button type="button" onClick={() => setOuvert(null)} className="flex items-center gap-1 text-sm font-semibold text-sapin"><ArrowLeft className="h-4 w-4" />{t("Retour", "Back")}</button>
            {ouvert.genre === "fiche" ? (
              <>
                <h3 className="mt-2 text-xl font-extrabold">{ouvert.fiche.titre[langue]}</h3>
                <ol className="mt-3 space-y-2.5">
                  {ouvert.fiche.etapes.map((e, k) => (
                    <li key={k} className="flex gap-2.5 text-sm"><span className="chiffres mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-sapin text-[11px] font-bold text-sur-sapin">{k + 1}</span>{e[langue]}</li>
                  ))}
                </ol>
                <p className="mt-4 flex gap-2 rounded-lg bg-attention-fond px-3 py-2 text-sm text-attention"><TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />{ouvert.fiche.precaution[langue]}</p>
              </>
            ) : (
              <>
                <h3 className="mt-2 text-xl font-extrabold">{ouvert.sujet.titre[langue]}</h3>
                {ouvert.sujet.id === enLien && (
                  <p className="mt-2 rounded-lg bg-attention-fond px-3 py-2 text-xs text-attention">{t("Une cliente a trouvé son parquet lavé trop mouillé : ces points peuvent servir.", "A client found her parquet washed too wet: these points may help.")}</p>
                )}
                <ul className="mt-3 space-y-2.5">
                  {ouvert.sujet.points.map((p, k) => (
                    <li key={k} className="flex gap-2.5 text-sm"><span className="chiffres mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-sapin text-[11px] font-bold text-sur-sapin">{k + 1}</span>{p[langue]}</li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}
      </div>

      <div className="min-w-0">
        <h2 className="text-lg font-bold">{t("Côté bureau", "Office side")}</h2>
        <div className="mt-2 max-w-[62ch] space-y-3 text-sm text-encre-2">
          <p>{t("Pas de formation à suivre ni de questionnaire à valider : les agents sont payés à l'heure de ménage, on ne leur ajoute pas d'obligation. C'est une base de connaissances qu'ils ouvrent quand ils en ont besoin, sur place, en français ou en anglais.",
            "No course to follow and no quiz to pass: cleaners are paid by the cleaning hour, so no extra obligation is added. It is a knowledge base they open when they need it, on site, in French or English.")}</p>
          <p>{t("Le bureau l'enrichit à partir des questions qui reviennent et des retours des clients. Quand une question n'a pas de fiche, l'assistant ménage répond.",
            "The office adds to it from recurring questions and client feedback. When a question has no sheet, the cleaning assistant answers.")}</p>
        </div>

        <h3 className="mt-8 font-bold">{t("Quand les notes baissent", "When ratings drop")}</h3>
        <p className="mt-1 max-w-[62ch] text-sm text-encre-2">{t("La coordination appelle l'agent et lui envoie la fiche qui correspond aux commentaires des clients.", "The coordinator calls the cleaner and sends the sheet that matches the clients' comments.")}</p>
        <ul className="mt-3 space-y-3">
          {enDifficulte.map(([id, ns]) => {
            const a = agent(id);
            return (
              <li key={id} className="rounded-xl border border-trait bg-surface p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold">{a.prenom} {a.nom}</p>
                  <span className="flex items-center gap-2 text-sm"><Etoiles valeur={moyenne(ns) ?? 0} /> <span className="chiffres">{moyenne(ns)}</span></span>
                </div>
                <p className="mt-1 text-sm text-encre-2">{t("Derniers commentaires :", "Latest comments:")} {ns.slice(-3).map((n) => `« ${n.commentaire} »`).join(" ")}</p>
                <p className="mt-2 text-sm font-semibold text-sapin">{t("Fiche à lui envoyer :", "Sheet to send:")} {sujetConseille(ns.map((n) => n.commentaire)).titre[langue]}</p>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
