"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, SendHorizontal } from "lucide-react";
import { useLangue, useT } from "@/lib/i18n";
import { client } from "@/lib/donnees";
import { useSimulation } from "@/lib/simulation";
import { appelerIA } from "@/components/ui";

type Message = { role: "user" | "assistant"; content: string; source?: "ia" | "regles"; erreur?: string };

const CLIENT = client("C001");

export default function Assistant() {
  const t = useT();
  const { langue } = useLangue();
  const { etat } = useSimulation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [question, setQuestion] = useState("");
  const [enCours, setEnCours] = useState(false);
  const [chezClient, setChezClient] = useState(true);
  const fil = useRef<HTMLDivElement>(null);
  const fiche = etat.fiches[CLIENT.id] ?? CLIENT.fiche;

  useEffect(() => {
    fil.current?.scrollTo({ top: fil.current.scrollHeight, behavior: "smooth" });
  }, [messages, enCours]);

  async function demander(q: string) {
    if (!q.trim() || enCours) return;
    const historique = messages.map(({ role, content }) => ({ role, content }));
    setMessages((m) => [...m, { role: "user", content: q }]);
    setQuestion("");
    setEnCours(true);
    try {
      const r = await appelerIA<string>({ action: "assistant", question: q, historique, fiche: chezClient ? fiche : null, langue });
      setMessages((m) => [...m, { role: "assistant", content: r.donnees, source: r.source, erreur: r.erreur }]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: t("Le service ne répond pas. Réessayez, ou appelez le bureau.", "The service isn't responding. Try again, or call the office."), source: "regles" }]);
    } finally {
      setEnCours(false);
    }
  }

  const suggestions = [
    t("Comment enlever le calcaire sur la paroi de douche ?", "How do I remove limescale from the shower glass?"),
    t("Tache de vin rouge sur un canapé en tissu", "Red wine stain on a fabric sofa"),
    t("Le four est très gras, je fais comment ?", "The oven is very greasy, what do I do?"),
    t("Joints noirs dans la salle de bain", "Black grout in the bathroom"),
  ];

  return (
    <div className="grid gap-10 lg:grid-cols-[400px_minmax(0,1fr)]">
      <div className="telephone mx-auto flex h-[720px] w-full max-w-[380px] flex-col rounded-[2.2rem] border-[10px] border-encre bg-fond p-4 shadow-[0_30px_60px_-30px_rgba(23,21,43,0.6)]">
        <p className="text-center text-xs text-encre-3">{t("Assistant ménage", "Cleaning assistant")}</p>
        <label className="mt-3 flex items-center gap-2 rounded-lg bg-surface px-3 py-2 text-xs">
          <input type="checkbox" className="accent-[var(--sapin)]" checked={chezClient} onChange={(e) => setChezClient(e.target.checked)} />
          {t("Je suis chez", "I'm at")} {CLIENT.nom} ({t("l'assistant connaît la fiche", "the assistant knows the sheet")})
        </label>
        <div ref={fil} className="mt-3 flex-1 space-y-3 overflow-y-auto pr-1" aria-live="polite">
          {messages.length === 0 && (
            <div className="space-y-2">
              <p className="text-sm text-encre-2">{t("Une question pendant un passage ? Quelques exemples :", "A question during a visit? A few examples:")}</p>
              {suggestions.map((s) => (
                <button key={s} type="button" onClick={() => demander(s)} className="block w-full rounded-xl border border-trait bg-surface px-3 py-2 text-left text-sm hover:border-trait-fort">{s}</button>
              ))}
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={m.role === "user" ? "ml-8" : "mr-4"}>
              <div className={`whitespace-pre-line rounded-2xl px-3.5 py-2.5 text-sm ${m.role === "user" ? "rounded-br-sm bg-sapin text-sur-sapin" : "rounded-bl-sm bg-surface"}`}>{m.content}</div>
            </div>
          ))}
          {enCours && <p className="flex items-center gap-2 text-sm text-encre-2"><Loader2 className="h-4 w-4 animate-spin" />{t("Réponse en préparation…", "Preparing an answer…")}</p>}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); demander(question); }} className="mt-3 flex items-end gap-2">
          <label className="sr-only" htmlFor="question">{t("Votre question", "Your question")}</label>
          <textarea id="question" rows={2} value={question} onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); demander(question); } }}
            placeholder={t("Écrivez votre question…", "Type your question…")} className="flex-1 resize-none rounded-xl border border-trait bg-surface px-3 py-2 text-sm" />
          <button type="submit" disabled={enCours || !question.trim()} aria-label={t("Envoyer", "Send")} className="grid h-11 w-11 place-items-center rounded-full bg-sapin text-sur-sapin disabled:opacity-40">
            <SendHorizontal className="h-4 w-4" />
          </button>
        </form>
      </div>

      <div className="min-w-0 space-y-6">
        <section>
          <h2 className="text-lg font-bold">{t("Pourquoi un assistant spécialisé", "Why a specialised assistant")}</h2>
          <p className="mt-2 max-w-[62ch] text-encre-2">
            {t("Les agents appellent le bureau pour des questions de métier : quel produit sur ce sol, comment rattraper cette tache. Chaque appel coûte du temps au bureau et à l'agent. L'assistant répond tout de suite, en étapes courtes, et rappelle les consignes du logement.",
              "Cleaners call the office with trade questions: which product on this floor, how to save this stain. Each call costs the office and the cleaner time. The assistant answers at once, in short steps, and recalls the home's instructions.")}
          </p>
        </section>
        <section className="rounded-xl border border-trait bg-surface p-5">
          <h3 className="font-bold">{t("Garde-fous", "Guardrails")}</h3>
          <ul className="mt-2 list-disc space-y-1.5 pl-4 text-sm text-encre-2">
            <li>{t("Ne répond qu'au ménage et à l'entretien ; tout le reste (salaire, litige, accident) renvoie au bureau.", "Only answers cleaning and care questions; anything else (pay, disputes, accidents) goes to the office.")}</li>
            <li>{t("Règles de sécurité fixes : jamais de mélange de produits, jamais d'acide sur la pierre naturelle, test sur une partie cachée.", "Fixed safety rules: never mix products, never acid on natural stone, test on a hidden spot.")}</li>
            <li>{t("Connaît la fiche du logement : chez les Rochat, il rappelle « pas de javel, pierre naturelle ».", "Knows the home sheet: at the Rochats', it recalls “no bleach, natural stone”.")}</li>
            <li>{t("Sans clé d'IA, il répond depuis sept fiches relues (calcaire, vin, four, joints, parquet, inox, vitres).", "Without an AI key, it answers from seven reviewed sheets (limescale, wine, oven, grout, parquet, stainless steel, windows).")}</li>
          </ul>
        </section>
        <section>
          <h3 className="font-bold">{t("Fiche du logement transmise", "Home sheet passed on")} · {CLIENT.nom}</h3>
          <ul className="mt-2 space-y-1 text-sm">
            {fiche.interdits.map((x) => <li key={x} className="font-medium text-alerte">{x}</li>)}
            {fiche.preferences.map((x) => <li key={x} className="text-encre-2">{x}</li>)}
          </ul>
        </section>
      </div>
    </div>
  );
}
