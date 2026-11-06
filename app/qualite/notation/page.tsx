"use client";

import { useMemo, useState } from "react";
import { BellRing, Loader2, Star } from "lucide-react";
import { useLangue, useT } from "@/lib/i18n";
import { agent, client } from "@/lib/donnees";
import { NOTES_HISTORIQUE } from "@/lib/donnees/qualite";
import { declencheAlerte, destinatairesAlerte, enBaisse, moyenne, type Note, type Sens } from "@/lib/regles/notation";
import { useIdentifiant, useSimulation } from "@/lib/simulation";
import { appelerIA, Bouton, Etoiles, Pastille } from "@/components/ui";
import { Brouillon } from "@/components/brouillon";

function SaisieEtoiles({ valeur, onChange, nom }: { valeur: number; onChange: (n: number) => void; nom: string }) {
  const t = useT();
  const [survol, setSurvol] = useState(0);
  const libelles = [t("Très mauvais", "Very poor"), t("Mauvais", "Poor"), t("Correct", "Fair"), t("Bien", "Good"), t("Excellent", "Excellent")];
  return (
    <div>
      <div role="radiogroup" aria-label={nom} className="flex gap-1" onMouseLeave={() => setSurvol(0)}>
        {[1, 2, 3, 4, 5].map((n) => {
          const plein = n <= (survol || valeur);
          return (
            <button key={n} type="button" role="radio" aria-checked={valeur === n} aria-label={`${n}/5 · ${libelles[n - 1]}`}
              onMouseEnter={() => setSurvol(n)} onClick={() => onChange(n)} className="rounded p-0.5">
              <Star className={`h-8 w-8 transition ${plein ? ((survol || valeur) <= 2 ? "fill-alerte text-alerte" : "fill-encre text-encre") : "text-trait-fort"}`} strokeWidth={1.5} />
            </button>
          );
        })}
      </div>
      <p className="mt-1 h-5 text-sm text-encre-2">{(survol || valeur) ? libelles[(survol || valeur) - 1] : ""}</p>
    </div>
  );
}

type Alerte = { messageBureau: string; messagePersonne: string };

function Formulaire({ sens }: { sens: Sens }) {
  const t = useT();
  const { langue } = useLangue();
  const { envoyer } = useSimulation();
  const id = useIdentifiant();
  const surAgent = sens === "client-note-agent";
  const auteur = surAgent ? client("C001") : agent("A001");
  const cible = surAgent ? agent("A001") : client("C003");
  const auteurNom = "prenom" in auteur ? `${auteur.prenom} ${auteur.nom}` : auteur.nom;
  const cibleNom = "prenom" in cible ? `${cible.prenom} ${cible.nom}` : cible.nom;
  const [etoiles, setEtoiles] = useState(0);
  const [commentaire, setCommentaire] = useState("");
  const [envoyee, setEnvoyee] = useState<{ etoiles: number; alerte: (Alerte & { source: "ia" | "regles"; erreur?: string }) | null } | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function noter() {
    setEnCours(true);
    const note: Note = { id: id("note"), sens, auteurId: auteur.id, cibleId: cible.id, etoiles, commentaire, date: new Date().toISOString() };
    envoyer({ type: "noter", note });
    let alerte: (Alerte & { source: "ia" | "regles"; erreur?: string }) | null = null;
    try {
      if (declencheAlerte(etoiles)) {
        const r = await appelerIA<Alerte>({ action: "alerte", sens, etoiles, commentaire, cibleNom, auteurNom, langue });
        alerte = { ...r.donnees, source: r.source, erreur: r.erreur };
        const bureau = destinatairesAlerte(sens, etoiles).filter((d) => d.role === "responsable-qualite" || d.role === "coordinateur");
        envoyer({
          type: "alerte",
          alerte: {
            id: id("alerte"), date: new Date().toISOString(), lue: false, lien: "/qualite/notation",
            titre: t(`${etoiles} étoile${etoiles > 1 ? "s" : ""} pour ${cibleNom}`, `${etoiles} star${etoiles > 1 ? "s" : ""} for ${cibleNom}`),
            detail: r.donnees.messageBureau,
            destinataires: bureau.map((d) => ({ ...d, message: r.donnees.messageBureau })),
          },
        });
      }
      setEnvoyee({ etoiles, alerte });
    } finally {
      setEnCours(false);
    }
  }

  return (
    <section className="rounded-2xl border border-trait bg-surface p-5 sm:p-6">
      <h3 className="text-lg font-bold">{surAgent ? t(`${auteurNom} note le passage de ${cibleNom}`, `${auteurNom} rates ${cibleNom}'s visit`) : t(`${auteurNom} note le passage chez ${cibleNom}`, `${auteurNom} rates the visit at ${cibleNom}`)}</h3>
      {!envoyee ? (
        <>
          <p className="mt-1 text-sm text-encre-2">
            {surAgent ? t("Ponctualité, qualité, discrétion.", "Punctuality, quality, discretion.") : t("Accueil, matériel prêt, accès, respect des horaires.", "Welcome, equipment ready, access, respect for timing.")}
          </p>
          <div className="mt-4"><SaisieEtoiles valeur={etoiles} onChange={setEtoiles} nom={t("Note", "Rating")} /></div>
          <label className="mt-2 block text-sm">
            <span className="text-xs font-semibold text-encre-2">{t("Commentaire (facultatif)", "Comment (optional)")}</span>
            <textarea value={commentaire} onChange={(e) => setCommentaire(e.target.value)} rows={2}
              placeholder={surAgent ? t("ex. arrivée en retard, salle de bain pas faite", "e.g. arrived late, bathroom not done") : t("ex. aspirateur en panne, personne pour ouvrir", "e.g. vacuum broken, nobody to let me in")}
              className="mt-1 w-full rounded-lg border border-trait bg-fond px-3 py-2" />
          </label>
          {etoiles > 0 && etoiles <= 2 && (
            <p className="mt-2 flex items-center gap-2 text-sm text-alerte"><BellRing className="h-4 w-4" />{t("Une note de 1 ou 2 étoiles déclenche une alerte.", "A 1 or 2 star rating triggers an alert.")}</p>
          )}
          <Bouton onClick={noter} disabled={etoiles === 0 || enCours} className="mt-3">
            {enCours && <Loader2 className="h-4 w-4 animate-spin" />}{t("Envoyer la note", "Send the rating")}
          </Bouton>
        </>
      ) : (
        <div className="arriver mt-3 space-y-4">
          <p className="flex items-center gap-3 text-sm"><Etoiles valeur={envoyee.etoiles} /> {t("Note enregistrée.", "Rating saved.")}</p>
          {envoyee.alerte ? (
            <>
              <div className="rounded-xl bg-alerte-fond p-4 text-sm">
                <p className="font-bold text-alerte">{t("Alerte envoyée (simulation) au service qualité et à la coordination", "Alert sent (simulated) to the quality manager and coordination")}</p>
                <p className="mt-1 text-encre-2">{envoyee.alerte.messageBureau}</p>
              </div>
              <Brouillon
                titre={surAgent ? t("Message à l'agent noté", "Message to the rated cleaner") : t("Message au client noté", "Message to the rated client")}
                destinataire={surAgent ? `${cibleNom} (${t("application", "app")})` : `${cibleNom} (e-mail)`}
                canal={surAgent ? "push" : "email"}
                avecObjet={false}
                corpsInitial={envoyee.alerte.messagePersonne}
                source={envoyee.alerte.source}
                erreur={envoyee.alerte.erreur}
              />
            </>
          ) : (
            <p className="text-sm text-encre-2">{t("Pas d'alerte : la note entre dans la moyenne.", "No alert: the rating goes into the average.")}</p>
          )}
          <button type="button" onClick={() => { setEnvoyee(null); setEtoiles(0); setCommentaire(""); }} className="text-sm font-semibold text-sapin hover:underline">{t("Donner une autre note", "Give another rating")}</button>
        </div>
      )}
    </section>
  );
}

export default function Notation() {
  const t = useT();
  const { etat } = useSimulation();
  const toutes = useMemo(() => [...etat.notes, ...NOTES_HISTORIQUE], [etat.notes]);
  const parCible = (sens: Sens) => {
    const m = new Map<string, Note[]>();
    toutes.filter((n) => n.sens === sens).forEach((n) => m.set(n.cibleId, [...(m.get(n.cibleId) ?? []), n]));
    return [...m.entries()].map(([id, ns]) => ({ id, ns, moy: moyenne(ns)!, baisse: enBaisse(ns), mini: Math.min(...ns.map((n) => n.etoiles)) })).sort((a, b) => a.moy - b.moy);
  };
  const agents = parCible("client-note-agent");
  const clients = parCible("agent-note-client");

  return (
    <div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Formulaire sens="client-note-agent" />
        <Formulaire sens="agent-note-client" />
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        {[
          { titre: t("Agents, notés par les clients", "Cleaners, rated by clients"), lignes: agents, nom: (id: string) => `${agent(id).prenom} ${agent(id).nom}` },
          { titre: t("Clients, notés par les agents", "Clients, rated by cleaners"), lignes: clients, nom: (id: string) => client(id).nom },
        ].map(({ titre, lignes, nom }) => (
          <section key={titre}>
            <h2 className="font-bold">{titre}</h2>
            <ul className="mt-3 divide-y divide-trait border-y border-trait">
              {lignes.map((l) => (
                <li key={l.id} className="flex flex-wrap items-center gap-3 py-3">
                  <span className="min-w-36 flex-1 font-semibold">{nom(l.id)}</span>
                  <Etoiles valeur={l.moy} />
                  <span className="chiffres w-8 text-right text-sm">{l.moy}</span>
                  <span className="text-xs text-encre-3">{l.ns.length} {t("note(s)", "rating(s)")}</span>
                  {l.mini <= 2 && <Pastille ton="alerte">{t("alerte", "alert")}</Pastille>}
                  {l.baisse && <Pastille ton="attention">{t("en baisse", "dropping")}</Pastille>}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <p className="mt-6 max-w-[72ch] text-xs text-encre-3">
        {t("Pourquoi noter les clients : un agent qui trouve deux fois un aspirateur en panne ou une porte fermée perd son temps et finit par partir. Le bureau le voit, et en parle avec le client avant de perdre l'agent. La personne notée ne voit jamais le nom de l'auteur.",
          "Why rate clients: a cleaner who twice finds a broken vacuum or a locked door loses time and ends up leaving. The office sees it and talks to the client before losing the cleaner. The rated person never sees who gave the rating.")}
      </p>
    </div>
  );
}
