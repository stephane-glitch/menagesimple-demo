"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import { Check, ChevronDown, Loader2, Mic, Square, Sparkles, TriangleAlert } from "lucide-react";
import { useLangue, useT } from "@/lib/i18n";
import { agent, client, JOUR_DEMO, type FicheLogement } from "@/lib/donnees";
import { NOTES_VOCALES } from "@/lib/donnees/qualite";
import type { Reformulation } from "@/lib/ia/repli";
import { useSimulation } from "@/lib/simulation";
import { appelerIA, Bouton } from "@/components/ui";

type Rubrique = "routine" | "preferences" | "interdits" | "acces";

// Reconnaissance vocale du navigateur (Chrome, Edge, Safari) : la dictée reste sur l'appareil ou le service du navigateur.
type Reconnaissance = {
  lang: string; continuous: boolean; interimResults: boolean;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onend: (() => void) | null; onerror: (() => void) | null; start: () => void; stop: () => void;
};

type FenetreVocale = { SpeechRecognition?: new () => Reconnaissance; webkitSpeechRecognition?: new () => Reconnaissance };
const sansAbonnement = () => () => {};

/** Dictée : chaque résultat est transmis à onTexte. */
function useDictee(langue: "fr" | "en", onTexte: (texte: string) => void) {
  const disponible = useSyncExternalStore(
    sansAbonnement,
    () => Boolean((window as unknown as FenetreVocale).SpeechRecognition ?? (window as unknown as FenetreVocale).webkitSpeechRecognition),
    () => false,
  );
  const [actif, setActif] = useState(false);
  const rec = useRef<Reconnaissance | null>(null);
  function demarrer() {
    const w = window as unknown as FenetreVocale;
    const Classe = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Classe) return;
    const r = new Classe();
    r.lang = langue === "fr" ? "fr-CH" : "en-GB";
    r.continuous = true;
    r.interimResults = true;
    r.onresult = (e) => onTexte(Array.from(e.results).map((x) => x[0].transcript).join(" "));
    r.onend = () => setActif(false);
    r.onerror = () => setActif(false);
    rec.current = r;
    onTexte("");
    setActif(true);
    r.start();
  }
  function arreter() {
    rec.current?.stop();
    setActif(false);
  }
  return { disponible, actif, demarrer, arreter };
}

export default function Preferences() {
  const t = useT();
  const { langue } = useLangue();
  const { etat, envoyer } = useSimulation();
  const [noteId, setNoteId] = useState(NOTES_VOCALES[0].id);
  const [libre, setLibre] = useState(false);
  const note = NOTES_VOCALES.find((n) => n.id === noteId)!;
  const cli = client(note.clientId);
  const fiche: FicheLogement = etat.fiches[cli.id] ?? cli.fiche;
  const [transcription, setTranscription] = useState(note.transcription);
  const [resultat, setResultat] = useState<(Reformulation & { source: "ia" | "regles"; erreur?: string }) | null>(null);
  const [garde, setGarde] = useState<Record<string, boolean>>({});
  const [enCours, setEnCours] = useState(false);
  const [valide, setValide] = useState(false);
  const [voirBrut, setVoirBrut] = useState(true);
  const dictee = useDictee(langue, setTranscription);

  function choisirNote(id: string) {
    setNoteId(id);
    setTranscription(NOTES_VOCALES.find((n) => n.id === id)!.transcription);
    setResultat(null); setValide(false); setLibre(false);
  }

  async function reformuler() {
    setEnCours(true); setValide(false);
    try {
      const r = await appelerIA<Reformulation>({ action: "reformuler", transcription, fiche, langue });
      setResultat({ ...r.donnees, source: r.source, erreur: r.erreur });
      const tout: Record<string, boolean> = {};
      (["routine", "preferences", "interdits", "acces"] as Rubrique[]).forEach((k) => r.donnees[k].forEach((x) => (tout[`${k}:${x}`] = true)));
      setGarde(tout);
    } finally {
      setEnCours(false);
    }
  }

  function valider() {
    if (!resultat) return;
    const ajoute = (k: Rubrique) => [...fiche[k], ...resultat[k].filter((x) => garde[`${k}:${x}`] && !fiche[k].includes(x))];
    envoyer({ type: "fiche", clientId: cli.id, fiche: { routine: ajoute("routine"), preferences: ajoute("preferences"), interdits: ajoute("interdits"), acces: ajoute("acces"), miseAJour: JOUR_DEMO } });
    setValide(true);
  }

  const RUBRIQUES: { k: Rubrique; fr: string; en: string; ton: string }[] = [
    { k: "interdits", fr: "À ne pas faire", en: "Don'ts", ton: "text-alerte" },
    { k: "routine", fr: "Routine", en: "Routine", ton: "text-encre" },
    { k: "preferences", fr: "Préférences", en: "Preferences", ton: "text-encre" },
    { k: "acces", fr: "Accès", en: "Access", ton: "text-encre" },
  ];

  const etape = valide ? 4 : resultat ? 3 : 1;
  const ETAPES = [
    { n: 1, fr: "L'agent dicte en sortant de chez le client", en: "The cleaner dictates when leaving the client's home" },
    { n: 2, fr: "La note devient des consignes claires", en: "The note becomes clear instructions" },
    { n: 3, fr: "Le bureau relit et valide", en: "The office reviews and approves" },
    { n: 4, fr: "Le prochain remplaçant reçoit la fiche", en: "The next substitute gets the sheet" },
  ];

  return (
    <div>
    <ol className="mb-8 grid gap-2 sm:grid-cols-4" aria-label={t("Étapes", "Steps")}>
      {ETAPES.map((e) => (
        <li key={e.n} aria-current={e.n === etape ? "step" : undefined}
          className={`flex items-start gap-2.5 rounded-xl border p-3 text-sm transition ${e.n === etape ? "border-sapin bg-surface font-semibold" : e.n < etape ? "border-trait bg-surface text-encre-2" : "border-trait text-encre-3"}`}>
          <span className={`chiffres grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-bold ${e.n < etape ? "bg-ok text-white" : e.n === etape ? "bg-sapin text-sur-sapin" : "bg-fond text-encre-3"}`}>
            {e.n < etape ? <Check className="h-3.5 w-3.5" /> : e.n}
          </span>
          {t(e.fr, e.en)}
        </li>
      ))}
    </ol>
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
      <div className="space-y-5">
        <section>
          <h2 className="text-lg font-bold">{t("Choisissez une note vocale", "Pick a voice note")}</h2>
          <p className="mt-1 text-sm text-encre-2">{t("Trois notes laissées par des agents en sortant d'un logement. Écoutez-en une, puis transformez-la en consignes.", "Three notes left by cleaners on leaving a home. Listen to one, then turn it into instructions.")}</p>
          <div role="radiogroup" aria-label={t("Note vocale", "Voice note")} className="mt-3 space-y-2">
            {NOTES_VOCALES.map((n) => {
              const c = client(n.clientId);
              const a = agent(n.agentId);
              const actif = n.id === noteId && !libre;
              return (
                <button key={n.id} type="button" role="radio" aria-checked={actif} onClick={() => choisirNote(n.id)}
                  className={`flex w-full items-center gap-3 rounded-xl border bg-surface p-3 text-left transition ${actif ? "border-sapin" : "border-trait hover:border-trait-fort"}`}>
                  <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${actif ? "bg-sapin text-sur-sapin" : "bg-fond text-encre-2"}`}><Mic className="h-4 w-4" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold">{c.nom}</span>
                    <span className="text-xs text-encre-3">{a.prenom} {a.nom} · {n.duree} · {n.date.split("-").reverse().join(".")}</span>
                  </span>
                </button>
              );
            })}
            <button type="button" onClick={() => { setLibre(true); setTranscription(""); setResultat(null); setValide(false); }} aria-pressed={libre}
              className={`flex w-full items-center gap-3 rounded-xl border border-dashed p-3 text-left text-sm ${libre ? "border-sapin bg-surface" : "border-trait-fort"}`}>
              <Mic className="h-4 w-4" /> {t("Dicter ou écrire ma propre note", "Dictate or type my own note")}
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-trait bg-surface p-5">
          {!libre && note.audio && (
            <audio controls preload="none" src={note.audio} className="w-full">
              {t("Votre navigateur ne lit pas l'audio.", "Your browser can't play audio.")}
            </audio>
          )}
          {!libre && !note.audio && <p className="text-xs text-encre-3">{t("Note sans enregistrement audio (transcription seule).", "Note without audio (transcript only).")}</p>}
          {libre && (
            <div className="flex flex-wrap items-center gap-3">
              {dictee.disponible ? (
                dictee.actif
                  ? <Bouton variante="danger" onClick={dictee.arreter}><Square className="h-4 w-4" />{t("Arrêter la dictée", "Stop dictation")}</Bouton>
                  : <Bouton onClick={dictee.demarrer}><Mic className="h-4 w-4" />{t("Dicter", "Dictate")}</Bouton>
              ) : <p className="text-xs text-encre-3">{t("Dictée non disponible dans ce navigateur : écrivez la note.", "Dictation unavailable in this browser: type the note.")}</p>}
              {dictee.actif && <span className="flex items-center gap-2 text-sm text-alerte"><span className="h-2 w-2 animate-pulse rounded-full bg-alerte" />{t("J'écoute…", "Listening…")}</span>}
            </div>
          )}
          <button type="button" onClick={() => setVoirBrut((v) => !v)} aria-expanded={voirBrut} className="mt-4 flex items-center gap-1 text-sm font-semibold">
            <ChevronDown className={`h-4 w-4 transition ${voirBrut ? "" : "-rotate-90"}`} /> {t("Transcription, telle que dite", "Transcript, as spoken")}
          </button>
          {voirBrut && (
            <textarea value={transcription} onChange={(e) => setTranscription(e.target.value)} rows={6}
              placeholder={t("Ce que vous avez remarqué chez le client…", "What you noticed at the client's…")}
              className="mt-2 w-full rounded-lg border border-trait bg-fond px-3 py-2 text-sm italic leading-relaxed text-encre-2" />
          )}
          <Bouton onClick={reformuler} disabled={enCours || transcription.trim().length < 10} className="mt-3">
            {enCours ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {t("Reformuler en consignes", "Turn into instructions")}
          </Bouton>
        </section>
      </div>

      <div className="min-w-0">
        <h2 className="text-lg font-bold">{t("La fiche du logement", "The home sheet")}</h2>
        <p className="mt-1 text-sm text-encre-2">
          {!resultat
            ? t("Voici ce que sait déjà le bureau sur ce client. Cliquez sur « Reformuler en consignes » pour voir ce que la note y ajoute.", "This is what the office already knows about this client. Click “Turn into instructions” to see what the note adds.")
            : !valide
              ? t("Les lignes surlignées viennent de la note. Le bureau décoche ce qui est faux, puis valide.", "Highlighted lines come from the note. The office unticks anything wrong, then approves.")
              : t("C'est cette fiche que le prochain remplaçant lit sur son téléphone avant d'entrer.", "This is the sheet the next substitute reads on their phone before going in.")}
        </p>
        {!resultat ? (
          <div className="mt-3 rounded-2xl border border-dashed border-trait-fort p-6">
            <p className="font-semibold">{t("Fiche actuelle", "Current sheet")} · {cli.nom}</p>
            <FicheAffichee fiche={fiche} />
          </div>
        ) : (
          <section className="arriver mt-3 rounded-2xl border border-trait bg-surface p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold">{cli.nom} · {cli.adresse}, {cli.commune}</p>
            </div>
            <p className="mt-2 text-sm text-encre-2">{resultat.resume}</p>
            <div className="mt-4 space-y-4">
              {RUBRIQUES.map(({ k, fr, en, ton }) => (
                <div key={k}>
                  <p className={`text-xs font-bold ${ton}`}>{t(fr, en)}</p>
                  <ul className="mt-1.5 space-y-1.5">
                    {fiche[k].map((x) => <li key={`a-${x}`} className="pl-6 text-sm text-encre-3">{x}</li>)}
                    {resultat[k].filter((x) => !fiche[k].includes(x)).map((x) => (
                      <li key={`n-${x}`}>
                        <label className="flex items-start gap-2 text-sm">
                          <input type="checkbox" className="mt-1 accent-[var(--sapin)]" disabled={valide} checked={!!garde[`${k}:${x}`]} onChange={(e) => setGarde({ ...garde, [`${k}:${x}`]: e.target.checked })} />
                          <span className="font-medium">{x} <span className="ml-1 rounded bg-citron px-1.5 py-0.5 text-[11px] font-bold">{t("nouveau", "new")}</span></span>
                        </label>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            {resultat.aSignaler.length > 0 && (
              <div className="mt-5 rounded-xl bg-attention-fond p-4 text-sm text-attention">
                <p className="flex items-center gap-2 font-bold"><TriangleAlert className="h-4 w-4" />{t("Pour le bureau, pas pour la fiche", "For the office, not the sheet")}</p>
                <ul className="mt-1 list-disc pl-5">{resultat.aSignaler.map((x) => <li key={x}>{x}</li>)}</ul>
              </div>
            )}
            <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-trait pt-4">
              {valide ? (
                <p className="flex items-center gap-2 text-sm font-semibold text-ok"><Check className="h-4 w-4" />{t("Fiche mise à jour. Le prochain remplaçant la reçoit avant son passage.", "Sheet updated. The next substitute gets it before their visit.")}</p>
              ) : (
                <>
                  <Bouton onClick={valider}><Check className="h-4 w-4" />{t("Relu, mettre à jour la fiche", "Reviewed, update the sheet")}</Bouton>
                  <span className="text-xs text-encre-3">{t("Décochez ce qui est faux : seules les lignes cochées entrent dans la fiche.", "Untick anything wrong: only ticked lines go into the sheet.")}</span>
                </>
              )}
            </div>
          </section>
        )}
        <p className="mt-4 text-xs text-encre-3">
          {t("Les voix des notes d'exemple sont des voix de synthèse (ElevenLabs) lisant un texte fictif. La dictée utilise la reconnaissance vocale du navigateur.",
            "The sample notes use synthetic voices (ElevenLabs) reading fictional text. Dictation uses the browser's speech recognition.")}
        </p>
      </div>
    </div>
    </div>
  );
}

function FicheAffichee({ fiche }: { fiche: FicheLogement }) {
  const t = useT();
  const blocs: [string, string[], string][] = [
    [t("À ne pas faire", "Don'ts"), fiche.interdits, "text-alerte"],
    [t("Routine", "Routine"), fiche.routine, ""],
    [t("Préférences", "Preferences"), fiche.preferences, ""],
    [t("Accès", "Access"), fiche.acces, ""],
  ];
  return (
    <div className="mt-3 space-y-3">
      {blocs.map(([titre, lignes, ton]) => (
        <div key={titre}>
          <p className={`text-xs font-bold ${ton}`}>{titre}</p>
          <ul className="mt-1 space-y-0.5 text-sm text-encre-2">{lignes.map((l) => <li key={l}>{l}</li>)}</ul>
        </div>
      ))}
      <p className="text-xs text-encre-3">{t("Mise à jour :", "Updated:")} {fiche.miseAJour.split("-").reverse().join(".")}</p>
    </div>
  );
}
